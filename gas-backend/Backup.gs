function getBackupHistory(request) {
  requireAdmin_(request);
  var files = getBackupFolder_().getFiles();
  var items = [];
  while (files.hasNext()) {
    var file = files.next();
    var metadata = parseBackupDescription_(file.getDescription());
    if (!metadata) continue;
    items.push({
      backup_id: file.getId(),
      format: metadata.format,
      created_at: metadata.created_at || file.getDateCreated().toISOString(),
      created_by: metadata.created_by || "",
      status: "completed",
      file_url: file.getUrl(),
    });
  }
  items.sort(function (left, right) {
    return String(right.created_at).localeCompare(String(left.created_at));
  });
  return { items: items.slice(0, 50) };
}

function createBackup(request) {
  var admin = requireAdmin_(request);
  var data = getRequestData_(request);
  var format = requireString_(data.format, "format").toUpperCase();
  assertAllowedValue_(format, ["CSV", "XLSX"], "format");
  var createdAt = getNowString_();
  var timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMdd-HHmmss"
  );
  var file = format === "CSV"
    ? createCsvBackup_(timestamp)
    : createXlsxBackup_(timestamp);
  var metadata = {
    format: format,
    created_at: createdAt,
    created_by: admin.user_id,
  };
  file.setDescription(JSON.stringify(metadata));
  writeAuditLog_(
    "create",
    "backup",
    file.getId(),
    admin.user_id,
    "",
    { format: format },
    "Backup created."
  );
  return {
    backup_id: file.getId(),
    format: format,
    created_at: createdAt,
    created_by: admin.user_id,
    status: "completed",
    file_url: file.getUrl(),
  };
}

function createCsvBackup_(timestamp) {
  var spreadsheet = getDatabaseSpreadsheet_();
  var blobs = spreadsheet.getSheets().map(function (sheet) {
    var values = sheet.getDataRange().getDisplayValues();
    var csv = values.map(function (row) {
      return row.map(escapeCsvValue_).join(",");
    }).join("\r\n");
    return Utilities.newBlob(csv, "text/csv", sheet.getName() + ".csv");
  });
  return getBackupFolder_().createFile(
    Utilities.zip(blobs, "blc-care-" + timestamp + "-csv.zip")
  );
}

function createXlsxBackup_(timestamp) {
  var url =
    "https://docs.google.com/spreadsheets/d/" +
    getSheetId_() +
    "/export?format=xlsx";
  var response = UrlFetchApp.fetch(url, {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    throw new AppError(ERROR_CODES.INTERNAL_ERROR, "XLSX 백업 생성에 실패했습니다.");
  }
  return getBackupFolder_().createFile(
    response.getBlob().setName("blc-care-" + timestamp + ".xlsx")
  );
}

function getBackupFolder_() {
  try {
    return DriveApp.getFolderById(getBackupFolderId_());
  } catch (error) {
    console.error(error);
    throw new AppError(
      ERROR_CODES.CONFIG_ERROR,
      "설정된 Google Drive 백업 폴더에 접근할 수 없습니다."
    );
  }
}

function escapeCsvValue_(value) {
  var text = String(value === undefined || value === null ? "" : value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function parseBackupDescription_(description) {
  if (!description) return null;
  try {
    var parsed = JSON.parse(description);
    return parsed && (parsed.format === "CSV" || parsed.format === "XLSX")
      ? parsed
      : null;
  } catch (error) {
    return null;
  }
}
