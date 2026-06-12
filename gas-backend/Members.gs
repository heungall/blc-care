var MEMBER_NUMBER_FIELDS = Object.freeze(["age"]);
var MEMBER_DETAIL_STRING_FIELDS = Object.freeze([
  "workplace",
  "occupation",
  "job_title",
]);
var MEMBER_LIST_FIELDS = Object.freeze([
  "member_id",
  "full_name",
  "display_name",
  "photo_url",
  "current_cell_id",
  "status",
]);

/**
 * Returns a filtered and paginated member list within the request user's scope.
 */
function getMembers(request) {
  var user = requireAuthenticatedUser_(request);
  assertCanReadMembers_(user);
  var data = getRequestData_(request);
  var requestedCellId = String(data.cell_id || "").trim();

  if (requestedCellId && !hasRole_(user, "admin")) {
    assertCanAccessCell_(user, requestedCellId);
  }

  var accessibleCellIds = hasRole_(user, "admin")
    ? null
    : getAssignedCellIds_(user);
  var cellsById = getCellsById_();
  var noteCounts = getUnresolvedNoteCounts_();
  var lastAttendanceDates = getLastAttendanceDates_();
  var keyword = normalizeSearchText_(data.keyword);
  var status = String(data.status || "").trim();
  var page = toPositiveInteger_(data.page, 1);
  var pageSize = toPositiveInteger_(data.page_size, 20, 100);

  var members = readSheetRecords_(SHEET_NAMES.MEMBERS)
    .filter(function (member) {
      var cellId = String(member.current_cell_id || "");
      var isAccessible =
        accessibleCellIds === null || accessibleCellIds.indexOf(cellId) >= 0;
      var matchesCell = !requestedCellId || cellId === requestedCellId;
      var matchesStatus = !status || String(member.status) === status;
      var searchableName = normalizeSearchText_(
        [member.full_name, member.display_name, member.name_aliases].join(" ")
      );
      var matchesKeyword = !keyword || searchableName.indexOf(keyword) >= 0;

      return isAccessible && matchesCell && matchesStatus && matchesKeyword;
    })
    .map(function (member) {
      var item = pickFields_(normalizeMemberRecord_(member), MEMBER_LIST_FIELDS);
      var cell = cellsById[String(member.current_cell_id || "")];
      item.current_cell_name = cell ? String(cell.cell_name) : "미지정 셀";
      item.last_attendance_date =
        lastAttendanceDates[String(member.member_id)] || "";
      item.unresolved_note_count = noteCounts[String(member.member_id)] || 0;
      return cleanRecord_(item);
    });

  if (String(data.sort || "name_asc") === "name_asc") {
    members.sort(function (left, right) {
      return String(left.display_name || left.full_name).localeCompare(
        String(right.display_name || right.full_name),
        "ko"
      );
    });
  }

  var total = members.length;
  var startIndex = (page - 1) * pageSize;

  return {
    items: members.slice(startIndex, startIndex + pageSize),
    pagination: {
      page: page,
      page_size: pageSize,
      total: total,
      total_pages: total === 0 ? 0 : Math.ceil(total / pageSize),
    },
  };
}

/**
 * Returns full member details and permitted history.
 */
function getMemberDetail(request) {
  var user = requireAuthenticatedUser_(request);
  assertCanReadMembers_(user);
  var data = getRequestData_(request);
  var memberId = String(data.member_id || "").trim();

  if (!memberId) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "member_id가 필요합니다.");
  }

  var memberRecord = findRecordById_(
    SHEET_NAMES.MEMBERS,
    "member_id",
    memberId
  );

  if (!memberRecord) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "성도 정보를 찾을 수 없습니다.");
  }

  assertCanAccessMember_(user, memberRecord);

  var member = normalizeMemberRecord_(memberRecord);
  var cell = getCellsById_()[String(member.current_cell_id || "")];
  member.current_cell_name = cell ? String(cell.cell_name) : "미지정 셀";

  var records = readSheetRecords_(SHEET_NAMES.WEEKLY_MEMBER_RECORDS)
    .filter(function (record) {
      return String(record.member_id) === memberId;
    })
    .map(normalizeWeeklyMemberRecord_)
    .sort(sortNewestFirst_);
  var notes = readSheetRecords_(SHEET_NAMES.MEMBER_NOTES)
    .filter(function (note) {
      return String(note.member_id) === memberId;
    })
    .map(normalizeMemberNote_)
    .sort(sortNewestFirst_);

  return {
    member: cleanRecord_(member),
    history: {
      records: records,
      notes: notes,
    },
  };
}

function getCellsById_() {
  return readSheetRecords_(SHEET_NAMES.CELLS).reduce(function (cellsById, cell) {
    cellsById[String(cell.cell_id)] = cell;
    return cellsById;
  }, {});
}

function getUnresolvedNoteCounts_() {
  return readSheetRecords_(SHEET_NAMES.MEMBER_NOTES).reduce(function (
    counts,
    note
  ) {
    if (!toBoolean_(note.resolved)) {
      var memberId = String(note.member_id);
      counts[memberId] = (counts[memberId] || 0) + 1;
    }
    return counts;
  },
  {});
}

function getLastAttendanceDates_() {
  return readSheetRecords_(SHEET_NAMES.WEEKLY_MEMBER_RECORDS).reduce(function (
    dates,
    record
  ) {
    if (String(record.attendance_status) !== "present") {
      return dates;
    }

    var memberId = String(record.member_id);
    var attendanceDate = String(record.report_date || record.week_start_date || "");
    if (attendanceDate && (!dates[memberId] || dates[memberId] < attendanceDate)) {
      dates[memberId] = attendanceDate;
    }
    return dates;
  },
  {});
}

function normalizeMemberRecord_(record) {
  var member = cleanRecord_(record);
  member.member_id = String(record.member_id);
  member.full_name = String(record.full_name);
  member.display_name = String(record.display_name);
  member.name_aliases = parseCommaSeparated_(record.name_aliases);
  member.status = String(record.status);

  MEMBER_NUMBER_FIELDS.forEach(function (field) {
    if (record[field] !== "") {
      member[field] = toNumber_(record[field], record[field]);
    }
  });
  MEMBER_DETAIL_STRING_FIELDS.forEach(function (field) {
    if (record[field] !== "") {
      member[field] = String(record[field]);
    }
  });

  return member;
}

function normalizeWeeklyMemberRecord_(record) {
  var normalized = cleanRecord_(record);
  if (record.prayer_parse_confidence !== "") {
    normalized.prayer_parse_confidence = toNumber_(
      record.prayer_parse_confidence,
      record.prayer_parse_confidence
    );
  }
  return normalized;
}

function normalizeMemberNote_(note) {
  var normalized = cleanRecord_(note);
  normalized.resolved = toBoolean_(note.resolved);
  return normalized;
}

function pickFields_(record, fields) {
  return fields.reduce(function (picked, field) {
    picked[field] = record[field];
    return picked;
  }, {});
}

function normalizeSearchText_(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function sortNewestFirst_(left, right) {
  var leftDate = String(
    left.week_start_date || left.recorded_date || left.created_at || ""
  );
  var rightDate = String(
    right.week_start_date || right.recorded_date || right.created_at || ""
  );
  return rightDate.localeCompare(leftDate);
}
