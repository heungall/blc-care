var NEWCOMER_STATUSES = Object.freeze([
  "new",
  "contacted",
  "converted",
  "archived",
]);

function createNewcomer(request) {
  var data = getRequestData_(request);
  if (!toBoolean_(data.privacy_agreed)) {
    throw new AppError(
      ERROR_CODES.BAD_REQUEST,
      "privacy_agreed must be true."
    );
  }

  var now = getNowString_();
  var newcomer = {
    newcomer_id: createId_("newcomer"),
    name: requireString_(data.name, "name"),
    phone: requireString_(data.phone, "phone"),
    address: String(data.address || "").trim(),
    visit_motivation: String(data.visit_motivation || "").trim(),
    visit_channel: String(data.visit_channel || "").trim(),
    faith_experience: String(data.faith_experience || "").trim(),
    after_service_plan: String(data.after_service_plan || "").trim(),
    privacy_agreed: true,
    status: "new",
    admin_memo: "",
    converted_member_id: "",
    submitted_at: now,
    updated_at: now,
    converted_at: "",
    converted_by: "",
  };

  upsertSheetRecordById_(
    SHEET_NAMES.NEWCOMERS,
    "newcomer_id",
    newcomer
  );
  writeAuditLog_(
    "create",
    "newcomers",
    newcomer.newcomer_id,
    "",
    "",
    { status: "new", privacy_agreed: true },
    "Public newcomer form submitted."
  );

  return {
    newcomer_id: newcomer.newcomer_id,
    status: newcomer.status,
    submitted_at: newcomer.submitted_at,
  };
}

function getNewcomers(request) {
  requireAdmin_(request);
  var data = getRequestData_(request);
  var status = String(data.status || "").trim();
  var keyword = normalizeEmail_(data.keyword);
  if (status) {
    assertAllowedValue_(status, NEWCOMER_STATUSES, "status");
  }

  var newcomers = readSheetRecords_(SHEET_NAMES.NEWCOMERS)
    .filter(function (newcomer) {
      if (status && String(newcomer.status) !== status) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return (
        normalizeEmail_(newcomer.name).indexOf(keyword) >= 0 ||
        normalizeEmail_(newcomer.phone).indexOf(keyword) >= 0
      );
    })
    .map(normalizeNewcomer_)
    .sort(function (left, right) {
      return right.submitted_at.localeCompare(left.submitted_at);
    });

  return { items: newcomers };
}

function updateNewcomerStatus(request) {
  var admin = requireAdmin_(request);
  var data = getRequestData_(request);
  var newcomerId = requireString_(data.newcomer_id, "newcomer_id");
  var status = requireString_(data.status, "status");
  assertAllowedValue_(status, NEWCOMER_STATUSES, "status");
  if (status === "converted") {
    throw new AppError(
      ERROR_CODES.BAD_REQUEST,
      "Use convertNewcomerToMember to set converted status."
    );
  }

  var existing = requireRecordById_(
    SHEET_NAMES.NEWCOMERS,
    "newcomer_id",
    newcomerId,
    "Newcomer"
  );
  if (String(existing.status) === "converted") {
    throw new AppError(
      ERROR_CODES.CONFLICT,
      "Converted newcomer status cannot be changed."
    );
  }

  var updated = copyRecord_(existing);
  updated.status = status;
  if (data.admin_memo !== undefined) {
    updated.admin_memo = String(data.admin_memo || "").trim();
  }
  updated.updated_at = getNowString_();
  upsertSheetRecordById_(
    SHEET_NAMES.NEWCOMERS,
    "newcomer_id",
    updated
  );
  writeAuditLog_(
    "update",
    "newcomers",
    newcomerId,
    admin.user_id,
    { status: String(existing.status) },
    { status: status },
    "Newcomer status updated."
  );

  return normalizeNewcomer_(updated);
}

function convertNewcomerToMember(request) {
  var admin = requireAdmin_(request);
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var data = getRequestData_(request);
    var newcomerId = requireString_(data.newcomer_id, "newcomer_id");
    var cellId = requireString_(data.cell_id, "cell_id");
    var newcomer = requireRecordById_(
      SHEET_NAMES.NEWCOMERS,
      "newcomer_id",
      newcomerId,
      "Newcomer"
    );

    if (
      String(newcomer.status) === "converted" ||
      String(newcomer.converted_member_id || "").trim()
    ) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        "Newcomer has already been converted."
      );
    }
    if (!toBoolean_(newcomer.privacy_agreed)) {
      throw new AppError(
        ERROR_CODES.CONFLICT,
        "Privacy consent is required before conversion."
      );
    }
    assertActiveCellExists_(cellId);

    var input = data.member || {};
    var now = getNowString_();
    var today = getTodayString_();
    var fullName = String(input.full_name || newcomer.name).trim();
    var member = {
      member_id: createId_("member"),
      full_name: requireString_(fullName, "member.full_name"),
      display_name: String(input.display_name || fullName).trim(),
      name_aliases: serializeCommaSeparated_(input.name_aliases || []),
      gender: String(input.gender || "").trim(),
      birth_date: String(input.birth_date || "").trim(),
      age: "",
      phone: String(newcomer.phone || "").trim(),
      address: String(newcomer.address || "").trim(),
      workplace: String(input.workplace || "").trim(),
      occupation: String(input.occupation || "").trim(),
      job_title: String(input.job_title || "").trim(),
      photo_url: "",
      current_cell_id: cellId,
      status: "active",
      first_visit_date: today,
      registration_date: today,
      baptism_status: String(input.baptism_status || "").trim(),
      faith_start_date: String(input.faith_start_date || "").trim(),
      ministry_info: String(input.ministry_info || "").trim(),
      created_at: now,
      updated_at: now,
    };
    var history = {
      history_id: createId_("history"),
      member_id: member.member_id,
      from_cell_id: "",
      to_cell_id: cellId,
      start_date: today,
      end_date: "",
      reason: "newcomer_conversion",
      changed_by: admin.user_id,
      created_at: now,
    };
    var updatedNewcomer = copyRecord_(newcomer);
    updatedNewcomer.status = "converted";
    updatedNewcomer.converted_member_id = member.member_id;
    updatedNewcomer.converted_at = now;
    updatedNewcomer.converted_by = admin.user_id;
    updatedNewcomer.updated_at = now;

    upsertSheetRecordById_(SHEET_NAMES.MEMBERS, "member_id", member);
    upsertSheetRecordById_(
      SHEET_NAMES.CELL_MEMBER_HISTORY,
      "history_id",
      history
    );
    upsertSheetRecordById_(
      SHEET_NAMES.NEWCOMERS,
      "newcomer_id",
      updatedNewcomer
    );
    writeAuditLog_(
      "convert",
      "newcomers",
      newcomerId,
      admin.user_id,
      { status: String(newcomer.status) },
      {
        status: "converted",
        converted_member_id: member.member_id,
        cell_id: cellId,
      },
      "Newcomer converted to member."
    );

    return {
      newcomer: normalizeNewcomer_(updatedNewcomer),
      member: normalizeMemberRecord_(member),
      cell_member_history_id: history.history_id,
    };
  } finally {
    lock.releaseLock();
  }
}

function normalizeNewcomer_(newcomer) {
  return {
    newcomer_id: String(newcomer.newcomer_id),
    name: String(newcomer.name),
    phone: String(newcomer.phone),
    address: String(newcomer.address || ""),
    visit_motivation: String(newcomer.visit_motivation || ""),
    visit_channel: String(newcomer.visit_channel || ""),
    faith_experience: String(newcomer.faith_experience || ""),
    after_service_plan: String(newcomer.after_service_plan || ""),
    privacy_agreed: toBoolean_(newcomer.privacy_agreed),
    status: String(newcomer.status),
    admin_memo: String(newcomer.admin_memo || ""),
    converted_member_id: String(newcomer.converted_member_id || ""),
    submitted_at: String(newcomer.submitted_at || ""),
    updated_at: String(newcomer.updated_at || ""),
    converted_at: String(newcomer.converted_at || ""),
    converted_by: String(newcomer.converted_by || ""),
  };
}
