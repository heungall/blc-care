var DEFAULT_SETTINGS = Object.freeze({
  church_name: "Bluelight Hongdae Church",
  app_name: "BLC Care",
  long_absence_months: "3",
  report_edit_deadline_day: "Sunday",
  timezone: "Asia/Seoul",
});

function getSettings(request) {
  requireAdmin_(request);
  return normalizeSettings_(readSheetRecords_(SHEET_NAMES.SETTINGS));
}

function updateSettings(request) {
  var admin = requireAdmin_(request);
  var data = getRequestData_(request);
  var values = {
    church_name: requireString_(data.church_name, "church_name"),
    app_name: requireString_(data.app_name, "app_name"),
    long_absence_months: String(
      toPositiveInteger_(data.long_absence_months, 0, 120)
    ),
    report_edit_deadline_day: requireString_(
      data.report_edit_deadline_day,
      "report_edit_deadline_day"
    ),
    timezone: requireString_(data.timezone, "timezone"),
  };
  if (values.long_absence_months === "0") {
    throw new AppError(
      ERROR_CODES.BAD_REQUEST,
      "long_absence_months must be a positive integer."
    );
  }
  assertAllowedValue_(
    values.report_edit_deadline_day,
    ["Sunday", "Monday", "Saturday"],
    "report_edit_deadline_day"
  );

  var now = getNowString_();
  Object.keys(values).forEach(function (key) {
    upsertSheetRecordById_(SHEET_NAMES.SETTINGS, "key", {
      key: key,
      value: values[key],
      updated_at: now,
      updated_by: admin.user_id,
    });
  });
  writeAuditLog_(
    "update",
    "settings",
    "app_settings",
    admin.user_id,
    "",
    { keys: Object.keys(values) },
    "Settings updated."
  );
  return normalizeSettings_(readSheetRecords_(SHEET_NAMES.SETTINGS));
}

function normalizeSettings_(records) {
  var values = Object.assign({}, DEFAULT_SETTINGS);
  records.forEach(function (record) {
    if (Object.prototype.hasOwnProperty.call(values, String(record.key))) {
      values[String(record.key)] = String(record.value);
    }
  });
  return {
    church_name: values.church_name,
    app_name: values.app_name,
    long_absence_months: toPositiveInteger_(values.long_absence_months, 3, 120),
    report_edit_deadline_day: values.report_edit_deadline_day,
    timezone: values.timezone,
  };
}
