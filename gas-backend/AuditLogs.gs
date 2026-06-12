function writeAuditLog_(
  action,
  targetType,
  targetId,
  changedBy,
  beforeValue,
  afterValue,
  memo
) {
  var log = {
    log_id: createId_("log"),
    action: action,
    target_type: targetType,
    target_id: targetId,
    changed_by: changedBy || "",
    changed_at: getNowString_(),
    before_value: stringifyAuditValue_(beforeValue),
    after_value: stringifyAuditValue_(afterValue),
    memo: memo || "",
  };

  upsertSheetRecordById_(SHEET_NAMES.AUDIT_LOGS, "log_id", log);
  return log;
}

function stringifyAuditValue_(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return JSON.stringify(value);
}
