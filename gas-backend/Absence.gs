var ABSENCE_ALERT_STATUSES = Object.freeze(["open", "checked", "resolved"]);

function getAbsenceAlerts(request) {
  requireAdmin_(request);
  var data = getRequestData_(request);
  var status = String(data.status || "").trim();
  var cellId = String(data.cell_id || "").trim();
  if (status) {
    assertAllowedValue_(status, ABSENCE_ALERT_STATUSES, "status");
  }

  return {
    items: readSheetRecords_(SHEET_NAMES.ABSENCE_ALERTS)
      .filter(function (alert) {
        return (
          (!status || String(alert.status) === status) &&
          (!cellId || String(alert.cell_id) === cellId)
        );
      })
      .map(normalizeAbsenceAlert_)
      .sort(function (left, right) {
        return String(right.created_at).localeCompare(String(left.created_at));
      }),
  };
}

function updateAbsenceAlert(request) {
  var admin = requireAdmin_(request);
  var data = getRequestData_(request);
  var alertId = requireString_(data.alert_id, "alert_id");
  var status = requireString_(data.status, "status");
  assertAllowedValue_(status, ABSENCE_ALERT_STATUSES, "status");
  var existing = requireRecordById_(
    SHEET_NAMES.ABSENCE_ALERTS,
    "alert_id",
    alertId,
    "Absence alert"
  );
  var updated = copyRecord_(existing);
  var now = getNowString_();
  updated.status = status;
  updated.memo = String(data.memo || "").trim();

  if (status === "checked") {
    updated.checked_at = now;
    updated.checked_by = admin.user_id;
    updated.resolved_at = "";
    updated.resolved_by = "";
  } else if (status === "resolved") {
    updated.resolved_at = now;
    updated.resolved_by = admin.user_id;
  } else {
    updated.checked_at = "";
    updated.checked_by = "";
    updated.resolved_at = "";
    updated.resolved_by = "";
  }

  upsertSheetRecordById_(SHEET_NAMES.ABSENCE_ALERTS, "alert_id", updated);
  writeAuditLog_(
    "update",
    "absence_alerts",
    alertId,
    admin.user_id,
    { status: String(existing.status || "") },
    { status: status },
    "Absence alert updated."
  );
  return normalizeAbsenceAlert_(updated);
}

function normalizeAbsenceAlert_(alert) {
  return {
    alert_id: String(alert.alert_id),
    member_id: String(alert.member_id),
    cell_id: String(alert.cell_id || ""),
    last_attended_date: String(alert.last_attended_date || ""),
    absence_months: toNumber_(alert.absence_months, 0),
    status: String(alert.status || "open"),
    memo: String(alert.memo || ""),
    created_at: String(alert.created_at || ""),
    checked_at: String(alert.checked_at || ""),
    checked_by: String(alert.checked_by || ""),
    resolved_at: String(alert.resolved_at || ""),
    resolved_by: String(alert.resolved_by || ""),
  };
}
