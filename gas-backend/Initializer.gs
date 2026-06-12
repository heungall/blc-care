var DATABASE_SHEET_SCHEMAS = Object.freeze({
  users: [
    "user_id", "email", "name", "roles", "active", "created_at", "updated_at",
  ],
  user_cell_assignments: [
    "assignment_id", "user_id", "cell_id", "assignment_role", "active",
    "start_date", "end_date", "created_at", "updated_at",
  ],
  members: [
    "member_id", "full_name", "display_name", "name_aliases", "photo_file_id",
    "photo_url", "phone", "birth_date", "age", "first_visit_date",
    "registration_date", "address", "workplace", "occupation", "job_title",
    "faith_start_year", "bible_study_status", "baptism_status", "family_info",
    "current_cell_id", "status", "memo", "created_at", "updated_at",
    "created_by", "updated_by",
  ],
  cells: [
    "cell_id", "cell_name", "active", "sort_order", "created_at", "updated_at",
  ],
  cell_member_history: [
    "history_id", "member_id", "from_cell_id", "to_cell_id", "start_date",
    "end_date", "reason", "changed_by", "created_at",
  ],
  weekly_cell_reports: [
    "report_id", "week_start_date", "week_end_date", "report_date", "cell_id",
    "leader_user_id", "overall_summary", "status", "locked", "created_at",
    "updated_at", "submitted_at",
  ],
  weekly_member_records: [
    "record_id", "report_id", "member_id", "cell_id", "week_start_date",
    "report_date", "attendance_status", "absence_reason", "sharing_summary",
    "prayer_request", "support_suggestion", "prayer_source_text",
    "prayer_parsed_by", "prayer_parse_confidence", "created_at", "updated_at",
    "created_by", "updated_by",
  ],
  member_notes: [
    "note_id", "member_id", "note", "recorded_date", "recorded_by",
    "resolved", "resolved_date", "resolved_by", "created_at", "updated_at",
  ],
  newcomers: [
    "newcomer_id", "name", "phone", "address", "visit_motivation",
    "visit_channel", "faith_experience", "after_service_plan", "privacy_agreed",
    "status", "admin_memo", "converted_member_id", "submitted_at",
    "updated_at", "converted_at", "converted_by",
  ],
  absence_alerts: [
    "alert_id", "member_id", "cell_id", "last_attended_date", "absence_months",
    "status", "memo", "created_at", "checked_at", "checked_by", "resolved_at",
    "resolved_by",
  ],
  settings: [
    "key", "value", "description", "updated_at", "updated_by",
  ],
  audit_logs: [
    "log_id", "action", "target_type", "target_id", "changed_by", "changed_at",
    "before_value", "after_value", "memo",
  ],
});

/**
 * Editor-only database setup. Creates missing Sheets and safely appends missing
 * schema headers without deleting or reordering existing data.
 */
function initializeDatabase() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    var spreadsheet = getDatabaseSpreadsheet_();
    preflightDatabaseInitialization_(spreadsheet);
    var result = Object.keys(DATABASE_SHEET_SCHEMAS).map(function (sheetName) {
      return initializeDatabaseSheet_(
        spreadsheet,
        sheetName,
        DATABASE_SHEET_SCHEMAS[sheetName]
      );
    });
    var summary = {
      spreadsheet_id: spreadsheet.getId(),
      sheets: result,
      created_count: countInitializationStatus_(result, "created"),
      updated_count: countInitializationStatus_(result, "updated"),
      unchanged_count: countInitializationStatus_(result, "unchanged"),
    };
    console.log(JSON.stringify(summary));
    return summary;
  } finally {
    lock.releaseLock();
  }
}

function preflightDatabaseInitialization_(spreadsheet) {
  Object.keys(DATABASE_SHEET_SCHEMAS).forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      return;
    }
    var actual = getInitializationHeaders_(sheet);
    if (actual.length) {
      assertKnownInitializationHeaders_(
        sheetName,
        actual,
        DATABASE_SHEET_SCHEMAS[sheetName]
      );
    }
  });
}

/**
 * Editor-only read-only schema check. Throws when any Sheet or header is
 * missing or conflicts with the documented schema.
 */
function validateDatabaseSchema() {
  var spreadsheet = getDatabaseSpreadsheet_();
  var result = Object.keys(DATABASE_SHEET_SCHEMAS).map(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      throw new AppError(
        ERROR_CODES.SHEET_NOT_FOUND,
        "필수 Sheet를 찾을 수 없습니다: " + sheetName
      );
    }
    var actual = getInitializationHeaders_(sheet);
    assertKnownInitializationHeaders_(
      sheetName,
      actual,
      DATABASE_SHEET_SCHEMAS[sheetName]
    );
    var missing = DATABASE_SHEET_SCHEMAS[sheetName].filter(function (header) {
      return actual.indexOf(header) < 0;
    });
    if (missing.length) {
      throw new AppError(
        ERROR_CODES.INVALID_SHEET,
        "필수 컬럼이 없습니다: " + sheetName + " (" + missing.join(", ") + ")"
      );
    }
    return { sheet_name: sheetName, status: "valid", header_count: actual.length };
  });
  console.log(JSON.stringify(result));
  return result;
}

function initializeDatabaseSheet_(spreadsheet, sheetName, expectedHeaders) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    writeInitializationHeaders_(sheet, expectedHeaders);
    return {
      sheet_name: sheetName,
      status: "created",
      added_headers: expectedHeaders.slice(),
    };
  }

  var actualHeaders = getInitializationHeaders_(sheet);
  if (!actualHeaders.length) {
    writeInitializationHeaders_(sheet, expectedHeaders);
    return {
      sheet_name: sheetName,
      status: "updated",
      added_headers: expectedHeaders.slice(),
    };
  }

  assertKnownInitializationHeaders_(sheetName, actualHeaders, expectedHeaders);
  var missingHeaders = expectedHeaders.filter(function (header) {
    return actualHeaders.indexOf(header) < 0;
  });
  if (!missingHeaders.length) {
    formatInitializationHeader_(sheet, actualHeaders.length);
    return { sheet_name: sheetName, status: "unchanged", added_headers: [] };
  }

  sheet
    .getRange(1, actualHeaders.length + 1, 1, missingHeaders.length)
    .setValues([missingHeaders]);
  formatInitializationHeader_(sheet, actualHeaders.length + missingHeaders.length);
  return {
    sheet_name: sheetName,
    status: "updated",
    added_headers: missingHeaders,
  };
}

function getInitializationHeaders_(sheet) {
  var lastColumn = sheet.getLastColumn();
  if (sheet.getLastRow() < 1 || lastColumn < 1) {
    return [];
  }
  var headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0].map(
    function (header) {
      return String(header).trim();
    }
  );
  while (headers.length && !headers[headers.length - 1]) {
    headers.pop();
  }
  return headers;
}

function assertKnownInitializationHeaders_(sheetName, actual, expected) {
  validateHeaders_(sheetName, actual);
  var unknown = actual.filter(function (header) {
    return expected.indexOf(header) < 0;
  });
  if (unknown.length) {
    throw new AppError(
      ERROR_CODES.INVALID_SHEET,
      "문서화되지 않은 컬럼이 있어 초기화를 중단했습니다: " +
        sheetName +
        " (" +
        unknown.join(", ") +
        ")"
    );
  }
}

function writeInitializationHeaders_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatInitializationHeader_(sheet, headers.length);
}

function formatInitializationHeader_(sheet, headerCount) {
  sheet.setFrozenRows(1);
  sheet
    .getRange(1, 1, 1, headerCount)
    .setFontWeight("bold")
    .setBackground("#dbeafe")
    .setWrap(true);
  sheet.autoResizeColumns(1, headerCount);
}

function countInitializationStatus_(results, status) {
  return results.filter(function (result) {
    return result.status === status;
  }).length;
}
