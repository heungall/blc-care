var REPORT_STATUSES = Object.freeze(["draft", "submitted", "locked"]);
var ATTENDANCE_STATUSES = Object.freeze([
  "present",
  "absent",
  "excused",
  "unknown",
]);
var PRAYER_PARSED_BY_VALUES = Object.freeze(["manual", "rule"]);

function getReports(request) {
  var user = requireAuthenticatedUser_(request);
  assertCanReadReports_(user);
  var data = getRequestData_(request);
  var requestedCellId = String(data.cell_id || "").trim();

  if (requestedCellId && !hasRole_(user, "admin")) {
    assertCanAccessCell_(user, requestedCellId);
  }

  var accessibleCellIds = hasRole_(user, "admin")
    ? null
    : getAssignedCellIds_(user);
  var cellsById = getCellsById_();
  var usersById = getUsersById_();
  var recordCounts = getReportRecordCounts_();
  var status = String(data.status || "").trim();
  var weekStartDate = String(data.week_start_date || "").trim();
  var page = toPositiveInteger_(data.page, 1);
  var pageSize = toPositiveInteger_(data.page_size, 20, 100);

  var reports = readSheetRecords_(SHEET_NAMES.WEEKLY_CELL_REPORTS)
    .filter(function (report) {
      var cellId = String(report.cell_id);
      return (
        (accessibleCellIds === null || accessibleCellIds.indexOf(cellId) >= 0) &&
        (!requestedCellId || requestedCellId === cellId) &&
        (!status || status === String(report.status)) &&
        (!weekStartDate || weekStartDate === String(report.week_start_date))
      );
    })
    .map(function (report) {
      var normalized = normalizeWeeklyCellReport_(report);
      var cell = cellsById[String(report.cell_id)];
      var leader = usersById[String(report.leader_user_id)];
      normalized.cell_name = cell ? String(cell.cell_name) : "미지정 셀";
      normalized.leader_name = leader ? String(leader.name) : "알 수 없음";
      normalized.record_count = recordCounts[String(report.report_id)] || 0;
      return normalized;
    })
    .sort(function (left, right) {
      return (
        String(right.week_start_date).localeCompare(String(left.week_start_date)) ||
        String(left.cell_name).localeCompare(String(right.cell_name), "ko")
      );
    });

  var total = reports.length;
  var startIndex = (page - 1) * pageSize;
  return {
    items: reports.slice(startIndex, startIndex + pageSize),
    pagination: {
      page: page,
      page_size: pageSize,
      total: total,
      total_pages: total === 0 ? 0 : Math.ceil(total / pageSize),
    },
  };
}

function getReportDetail(request) {
  var user = requireAuthenticatedUser_(request);
  assertCanReadReports_(user);
  var data = getRequestData_(request);
  var reportId = String(data.report_id || "").trim();

  if (!reportId) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "report_id가 필요합니다.");
  }

  var report = findRecordById_(
    SHEET_NAMES.WEEKLY_CELL_REPORTS,
    "report_id",
    reportId
  );
  if (!report) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "리포트를 찾을 수 없습니다.");
  }

  assertCanAccessCell_(user, String(report.cell_id));
  return buildReportDetail_(report, user);
}

function getWeeklyReportDraft(request) {
  var user = requireAuthenticatedUser_(request);
  assertCanReadReports_(user);
  var data = getRequestData_(request);
  var cellId = String(data.cell_id || "").trim();

  if (!cellId) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "cell_id가 필요합니다.");
  }
  assertCanAccessCell_(user, cellId);

  var requestedDate = data.week_start_date || getTodayString_();
  var requestedWeekStart = requireDateString_(requestedDate, "week_start_date");
  var week = getWeekRange_(requestedWeekStart);
  if (data.week_start_date && week.week_start_date !== requestedWeekStart) {
    throw new AppError(
      ERROR_CODES.BAD_REQUEST,
      "week_start_date는 월요일이어야 합니다."
    );
  }
  var existingReport = findRecordByFields_(SHEET_NAMES.WEEKLY_CELL_REPORTS, {
    cell_id: cellId,
    week_start_date: week.week_start_date,
  });
  if (!existingReport) {
    assertActiveCellExists_(cellId);
  }
  var existingRecords = existingReport
    ? getRecordsForReport_(existingReport.report_id)
    : [];
  var existingByMemberId = existingRecords.reduce(function (items, record) {
    items[String(record.member_id)] = record;
    return items;
  }, {});
  var members = readSheetRecords_(SHEET_NAMES.MEMBERS)
    .filter(function (member) {
      return (
        String(member.current_cell_id) === cellId &&
        String(member.status) === "active"
      );
    })
    .map(normalizeMemberRecord_)
    .sort(function (left, right) {
      return String(left.display_name).localeCompare(String(right.display_name), "ko");
    });
  var records = existingRecords.slice();
  members.forEach(function (member) {
    if (!existingByMemberId[member.member_id]) {
      records.push({
        member_id: member.member_id,
        cell_id: cellId,
        week_start_date: week.week_start_date,
        attendance_status: "unknown",
      });
    }
  });

  return {
    is_existing: Boolean(existingReport),
    report: existingReport
      ? normalizeWeeklyCellReport_(existingReport)
      : {
          report_id: null,
          cell_id: cellId,
          week_start_date: week.week_start_date,
          week_end_date: week.week_end_date,
          status: "draft",
          locked: false,
        },
    members: members.map(function (member) {
      return {
        member_id: member.member_id,
        display_name: member.display_name,
        full_name: member.full_name,
      };
    }),
    records: records,
    can_edit: canEditReport_(
      user,
      existingReport || {
        cell_id: cellId,
        week_start_date: week.week_start_date,
        week_end_date: week.week_end_date,
        status: "draft",
        locked: false,
      }
    ),
  };
}

function saveWeeklyReport(request) {
  var user = requireAuthenticatedUser_(request);
  assertCanReadReports_(user);
  var data = getRequestData_(request);
  var lock = LockService.getScriptLock();

  lock.waitLock(30000);
  try {
    return saveWeeklyReportLocked_(user, data);
  } finally {
    lock.releaseLock();
  }
}

function saveWeeklyReportLocked_(user, data) {
  var cellId = String(data.cell_id || "").trim();
  if (!cellId) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "cell_id가 필요합니다.");
  }
  assertCanAccessCell_(user, cellId);

  var weekStartDate = requireDateString_(data.week_start_date, "week_start_date");
  var week = getWeekRange_(weekStartDate);
  if (week.week_start_date !== weekStartDate) {
    throw new AppError(
      ERROR_CODES.BAD_REQUEST,
      "week_start_date는 월요일이어야 합니다."
    );
  }

  var reportDate = data.report_date
    ? requireDateString_(data.report_date, "report_date")
    : "";
  if (
    reportDate &&
    !isDateWithinRange_(reportDate, week.week_start_date, week.week_end_date)
  ) {
    throw new AppError(
      ERROR_CODES.BAD_REQUEST,
      "report_date는 해당 주차 안의 날짜여야 합니다."
    );
  }
  var status = String(data.status || "draft");
  if (REPORT_STATUSES.indexOf(status) < 0) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "올바르지 않은 리포트 상태입니다.");
  }
  if (status === "locked" && !hasRole_(user, "admin")) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "리포트를 잠글 권한이 없습니다.");
  }

  var existingReport = findRecordByFields_(SHEET_NAMES.WEEKLY_CELL_REPORTS, {
    cell_id: cellId,
    week_start_date: weekStartDate,
  });
  if (!existingReport) {
    assertActiveCellExists_(cellId);
  }
  var requestedReportId = String(data.report_id || "").trim();
  if (
    existingReport &&
    requestedReportId &&
    requestedReportId !== String(existingReport.report_id)
  ) {
    throw new AppError(
      ERROR_CODES.CONFLICT,
      "동일 셀과 주차의 리포트가 이미 존재합니다."
    );
  }
  if (!existingReport && requestedReportId) {
    var reportById = findRecordById_(
      SHEET_NAMES.WEEKLY_CELL_REPORTS,
      "report_id",
      requestedReportId
    );
    if (reportById) {
      throw new AppError(ERROR_CODES.CONFLICT, "report_id가 이미 사용 중입니다.");
    }
  }

  var permissionReport =
    existingReport ||
    {
      cell_id: cellId,
      week_start_date: week.week_start_date,
      week_end_date: week.week_end_date,
      status: "draft",
      locked: false,
    };
  assertCanEditReport_(user, permissionReport);

  var records = validateReportRecords_(data.records, cellId, existingReport);
  var now = getNowString_();
  var reportId = existingReport
    ? String(existingReport.report_id)
    : requestedReportId || createId_("report");
  var locked =
    status === "locked" ||
    (hasRole_(user, "admin") && data.locked !== undefined
      ? toBoolean_(data.locked)
      : existingReport
        ? toBoolean_(existingReport.locked)
        : false);
  var report = {
    report_id: reportId,
    week_start_date: week.week_start_date,
    week_end_date: week.week_end_date,
    report_date: reportDate,
    cell_id: cellId,
    leader_user_id: existingReport
      ? String(existingReport.leader_user_id)
      : user.user_id,
    overall_summary: String(data.overall_summary || ""),
    status: status,
    locked: locked,
    created_at: existingReport ? existingReport.created_at : now,
    updated_at: now,
    submitted_at:
      status === "submitted"
        ? existingReport && existingReport.submitted_at
          ? existingReport.submitted_at
          : now
        : "",
  };

  upsertSheetRecordById_(
    SHEET_NAMES.WEEKLY_CELL_REPORTS,
    "report_id",
    report
  );

  records.forEach(function (record) {
    var existingRecord = findRecordByFields_(SHEET_NAMES.WEEKLY_MEMBER_RECORDS, {
      report_id: reportId,
      member_id: record.member_id,
    });
    var savedRecord = Object.assign({}, record, {
      record_id: existingRecord
        ? String(existingRecord.record_id)
        : createId_("record"),
      report_id: reportId,
      cell_id: cellId,
      week_start_date: week.week_start_date,
      report_date: reportDate,
      created_at: existingRecord ? existingRecord.created_at : now,
      updated_at: now,
      created_by: existingRecord ? existingRecord.created_by : user.user_id,
      updated_by: user.user_id,
    });
    upsertSheetRecordById_(
      SHEET_NAMES.WEEKLY_MEMBER_RECORDS,
      "record_id",
      savedRecord
    );
  });

  return buildReportDetail_(report, user);
}

function validateReportRecords_(records, cellId, existingReport) {
  if (!Array.isArray(records)) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "records는 배열이어야 합니다.");
  }

  var seenMemberIds = {};
  var existingMemberIds = existingReport
    ? getRecordsForReport_(existingReport.report_id).reduce(function (ids, record) {
        ids[String(record.member_id)] = true;
        return ids;
      }, {})
    : {};

  return records.map(function (record) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "개인 기록 형식이 올바르지 않습니다.");
    }

    var memberId = String(record.member_id || "").trim();
    if (!memberId) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "records.member_id가 필요합니다.");
    }
    if (seenMemberIds[memberId]) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        "한 리포트에 동일한 성도 기록을 중복 저장할 수 없습니다."
      );
    }
    seenMemberIds[memberId] = true;

    var member = findRecordById_(SHEET_NAMES.MEMBERS, "member_id", memberId);
    if (
      !member ||
      (String(member.current_cell_id) !== cellId && !existingMemberIds[memberId])
    ) {
      throw new AppError(
        ERROR_CODES.BAD_REQUEST,
        "선택된 셀에 속하지 않은 성도 기록이 포함되어 있습니다."
      );
    }

    var attendanceStatus = String(record.attendance_status || "unknown");
    if (ATTENDANCE_STATUSES.indexOf(attendanceStatus) < 0) {
      throw new AppError(ERROR_CODES.BAD_REQUEST, "출석 상태가 올바르지 않습니다.");
    }
    var prayerParsedBy = String(record.prayer_parsed_by || "").trim();
    if (prayerParsedBy && PRAYER_PARSED_BY_VALUES.indexOf(prayerParsedBy) < 0) {
      throw new AppError(
        ERROR_CODES.BAD_REQUEST,
        "MVP에서는 manual 또는 rule 파싱 값만 저장할 수 있습니다."
      );
    }
    var confidence =
      record.prayer_parse_confidence === undefined ||
      record.prayer_parse_confidence === ""
        ? ""
        : Number(record.prayer_parse_confidence);
    if (
      confidence !== "" &&
      (!Number.isFinite(confidence) || confidence < 0 || confidence > 1)
    ) {
      throw new AppError(
        ERROR_CODES.BAD_REQUEST,
        "prayer_parse_confidence는 0 이상 1 이하 숫자여야 합니다."
      );
    }

    return {
      member_id: memberId,
      attendance_status: attendanceStatus,
      absence_reason: String(record.absence_reason || ""),
      sharing_summary: String(record.sharing_summary || ""),
      prayer_request: String(record.prayer_request || ""),
      support_suggestion: String(record.support_suggestion || ""),
      prayer_source_text: String(record.prayer_source_text || ""),
      prayer_parsed_by: prayerParsedBy,
      prayer_parse_confidence: confidence,
    };
  });
}

function buildReportDetail_(report, user) {
  var normalized = normalizeWeeklyCellReport_(report);
  var cell = getCellsById_()[String(report.cell_id)];
  var leader = getUsersById_()[String(report.leader_user_id)];
  normalized.cell_name = cell ? String(cell.cell_name) : "미지정 셀";
  normalized.leader_name = leader ? String(leader.name) : "알 수 없음";

  return {
    report: normalized,
    records: getRecordsForReport_(report.report_id),
    can_edit: canEditReport_(user, normalized),
  };
}

function normalizeWeeklyCellReport_(report) {
  var normalized = cleanRecord_(report);
  normalized.locked =
    toBoolean_(report.locked) ||
    String(report.status) === "locked" ||
    getTodayString_() > String(report.week_end_date);
  return normalized;
}

function getRecordsForReport_(reportId) {
  var seenMemberIds = {};
  return readSheetRecords_(SHEET_NAMES.WEEKLY_MEMBER_RECORDS)
    .filter(function (record) {
      return String(record.report_id) === String(reportId);
    })
    .map(function (record) {
      var memberId = String(record.member_id);
      if (seenMemberIds[memberId]) {
        throw new AppError(
          ERROR_CODES.CONFLICT,
          "동일 리포트와 성도의 개인 기록이 중복되어 있습니다."
        );
      }
      seenMemberIds[memberId] = true;
      return normalizeWeeklyMemberRecord_(record);
    })
    .sort(function (left, right) {
      return String(left.member_id).localeCompare(String(right.member_id));
    });
}

function canEditReport_(user, report) {
  if (hasRole_(user, "admin")) {
    return true;
  }
  return (
    hasRole_(user, "cell_leader") &&
    canAccessCell_(user, String(report.cell_id)) &&
    !toBoolean_(report.locked) &&
    String(report.status) !== "locked" &&
    isDateWithinRange_(
      getTodayString_(),
      report.week_start_date,
      report.week_end_date
    )
  );
}

function getReportRecordCounts_() {
  return readSheetRecords_(SHEET_NAMES.WEEKLY_MEMBER_RECORDS).reduce(function (
    counts,
    record
  ) {
    var reportId = String(record.report_id);
    counts[reportId] = (counts[reportId] || 0) + 1;
    return counts;
  },
  {});
}

function getUsersById_() {
  return readSheetRecords_(SHEET_NAMES.USERS).reduce(function (usersById, user) {
    usersById[String(user.user_id)] = user;
    return usersById;
  }, {});
}
