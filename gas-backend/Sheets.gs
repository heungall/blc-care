var SHEET_NAMES = Object.freeze({
  USERS: "users",
  USER_CELL_ASSIGNMENTS: "user_cell_assignments",
  CELLS: "cells",
  CELL_MEMBER_HISTORY: "cell_member_history",
  MEMBERS: "members",
  WEEKLY_CELL_REPORTS: "weekly_cell_reports",
  WEEKLY_MEMBER_RECORDS: "weekly_member_records",
  MEMBER_NOTES: "member_notes",
  NEWCOMERS: "newcomers",
  ABSENCE_ALERTS: "absence_alerts",
  SETTINGS: "settings",
  AUDIT_LOGS: "audit_logs",
});

function getDatabaseSpreadsheet_() {
  try {
    return SpreadsheetApp.openById(getSheetId_());
  } catch (error) {
    console.error(error);
    throw new AppError(
      ERROR_CODES.CONFIG_ERROR,
      "설정된 Google Sheets에 접근할 수 없습니다."
    );
  }
}

function getSheetByName_(sheetName) {
  var sheet = getDatabaseSpreadsheet_().getSheetByName(sheetName);

  if (!sheet) {
    throw new AppError(
      ERROR_CODES.SHEET_NOT_FOUND,
      "필수 Sheet를 찾을 수 없습니다: " + sheetName
    );
  }

  return sheet;
}

/**
 * Reads a Sheet into header-keyed records. Sheet row numbers are never exposed
 * or used as entity identifiers.
 */
function readSheetRecords_(sheetName) {
  var sheet = getSheetByName_(sheetName);
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  if (lastRow < 1 || lastColumn < 1) {
    throw new AppError(
      ERROR_CODES.INVALID_SHEET,
      "Sheet의 첫 번째 행에 컬럼명이 필요합니다: " + sheetName
    );
  }

  var values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  var headers = values[0].map(function (header) {
    return String(header).trim();
  });

  validateHeaders_(sheetName, headers);

  return values.slice(1).reduce(function (records, row) {
    var hasValue = row.some(function (value) {
      return String(value).trim() !== "";
    });

    if (!hasValue) {
      return records;
    }

    var record = {};
    headers.forEach(function (header, index) {
      record[header] = row[index];
    });
    records.push(record);
    return records;
  }, []);
}

function validateHeaders_(sheetName, headers) {
  var seen = {};

  headers.forEach(function (header) {
    if (!header || seen[header]) {
      throw new AppError(
        ERROR_CODES.INVALID_SHEET,
        "Sheet 컬럼명이 비어 있거나 중복되었습니다: " + sheetName
      );
    }
    seen[header] = true;
  });
}

function findUserByEmail_(email) {
  var normalizedEmail = normalizeEmail_(email);
  var matches = readSheetRecords_(SHEET_NAMES.USERS).filter(function (user) {
    return normalizeEmail_(user.email) === normalizedEmail;
  });

  if (matches.length > 1) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      "동일한 이메일의 사용자 계정이 중복되어 있습니다."
    );
  }

  return matches[0] || null;
}

function findRecordById_(sheetName, idColumn, id) {
  var matches = readSheetRecords_(sheetName).filter(function (record) {
    return String(record[idColumn]) === String(id);
  });

  if (matches.length > 1) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      "동일한 ID의 데이터가 중복되어 있습니다: " + sheetName
    );
  }

  return matches[0] || null;
}

function findRecordByFields_(sheetName, criteria) {
  var matches = readSheetRecords_(sheetName).filter(function (record) {
    return Object.keys(criteria).every(function (key) {
      return String(record[key]) === String(criteria[key]);
    });
  });

  if (matches.length > 1) {
    throw new AppError(
      ERROR_CODES.CONFLICT,
      "유니크 조건이 중복된 데이터가 있습니다: " + sheetName
    );
  }

  return matches[0] || null;
}

/**
 * Upserts by an entity ID column. Row numbers are only located after matching
 * the stable ID and are never used as entity identifiers.
 */
function upsertSheetRecordById_(sheetName, idColumn, record) {
  var sheet = getSheetByName_(sheetName);
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();
  if (lastRow < 1 || lastColumn < 1) {
    throw new AppError(
      ERROR_CODES.INVALID_SHEET,
      "Sheet의 첫 번째 행에 컬럼명이 필요합니다: " + sheetName
    );
  }
  var values = sheet.getRange(1, 1, Math.max(lastRow, 1), lastColumn).getDisplayValues();
  var headers = values[0].map(function (header) {
    return String(header).trim();
  });

  validateHeaders_(sheetName, headers);
  var idIndex = headers.indexOf(idColumn);
  if (idIndex < 0) {
    throw new AppError(
      ERROR_CODES.INVALID_SHEET,
      "필수 ID 컬럼을 찾을 수 없습니다: " + idColumn
    );
  }

  var matchingRows = [];
  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][idIndex]) === String(record[idColumn])) {
      matchingRows.push(rowIndex + 1);
    }
  }

  if (matchingRows.length > 1) {
    throw new AppError(
      ERROR_CODES.CONFLICT,
      "동일한 ID의 데이터가 중복되어 있습니다: " + sheetName
    );
  }

  var existing = matchingRows.length
    ? headers.reduce(function (item, header, index) {
        item[header] = values[matchingRows[0] - 1][index];
        return item;
      }, {})
    : {};
  var merged = Object.assign({}, existing, record);
  var row = headers.map(function (header) {
    var value = merged[header];
    if (value === true) return "TRUE";
    if (value === false) return "FALSE";
    return value === undefined || value === null ? "" : value;
  });

  if (matchingRows.length) {
    sheet.getRange(matchingRows[0], 1, 1, lastColumn).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return merged;
}

/**
 * Returns current, active cell assignments joined with active cells by ID.
 */
function getAssignedCellsForUser_(userId) {
  var today = getTodayString_();
  var assignments = readSheetRecords_(
    SHEET_NAMES.USER_CELL_ASSIGNMENTS
  ).filter(function (assignment) {
    return (
      String(assignment.user_id) === String(userId) &&
      toBoolean_(assignment.active) &&
      isDateWithinRange_(today, assignment.start_date, assignment.end_date)
    );
  });

  var activeCellsById = readSheetRecords_(SHEET_NAMES.CELLS).reduce(function (
    cellsById,
    cell
  ) {
    if (toBoolean_(cell.active)) {
      cellsById[String(cell.cell_id)] = cell;
    }
    return cellsById;
  },
  {});

  return assignments
    .filter(function (assignment) {
      return Boolean(activeCellsById[String(assignment.cell_id)]);
    })
    .map(function (assignment) {
      var cell = activeCellsById[String(assignment.cell_id)];
      return {
        cell_id: String(cell.cell_id),
        cell_name: String(cell.cell_name),
        assignment_role: String(assignment.assignment_role),
      };
    })
    .sort(function (left, right) {
      var leftCell = activeCellsById[left.cell_id];
      var rightCell = activeCellsById[right.cell_id];
      var orderDifference =
        toNumber_(leftCell.sort_order, Number.MAX_SAFE_INTEGER) -
        toNumber_(rightCell.sort_order, Number.MAX_SAFE_INTEGER);

      return orderDifference || left.cell_name.localeCompare(right.cell_name);
    });
}
