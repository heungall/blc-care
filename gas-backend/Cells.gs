function getCells(request) {
  var user = requireAuthenticatedUser_(request);
  var data = getRequestData_(request);
  var active = optionalBoolean_(data.active);
  var allowedCellIds = getAssignedCellIds_(user);

  var cells = readSheetRecords_(SHEET_NAMES.CELLS)
    .filter(function (cell) {
      return (
        (hasRole_(user, "admin") ||
          allowedCellIds.indexOf(String(cell.cell_id)) >= 0) &&
        (active === null || toBoolean_(cell.active) === active)
      );
    })
    .map(normalizeManagedCell_)
    .sort(function (left, right) {
      return (
        left.sort_order - right.sort_order ||
        left.cell_name.localeCompare(right.cell_name, "ko")
      );
    });

  return { items: cells };
}

function createCell(request) {
  var admin = requireAdmin_(request);
  var data = getRequestData_(request);
  var cellName = requireString_(data.cell_name, "cell_name");
  assertUniqueCellName_(cellName, "");
  var currentCells = readSheetRecords_(SHEET_NAMES.CELLS);
  var now = getNowString_();
  var cell = {
    cell_id: createId_("cell"),
    cell_name: cellName,
    active: data.active === undefined ? true : toBoolean_(data.active),
    sort_order:
      data.sort_order === undefined
        ? getNextCellSortOrder_(currentCells)
        : requireSortOrder_(data.sort_order),
    created_at: now,
    updated_at: now,
  };

  upsertSheetRecordById_(SHEET_NAMES.CELLS, "cell_id", cell);
  writeAuditLog_(
    "create",
    "cells",
    cell.cell_id,
    admin.user_id,
    "",
    { active: cell.active, sort_order: cell.sort_order },
    "Cell created."
  );
  return normalizeManagedCell_(cell);
}

function updateCell(request) {
  var admin = requireAdmin_(request);
  var data = getRequestData_(request);
  var cellId = requireString_(data.cell_id, "cell_id");
  var existing = requireRecordById_(
    SHEET_NAMES.CELLS,
    "cell_id",
    cellId,
    "Cell"
  );
  var updated = copyRecord_(existing);

  if (data.cell_name !== undefined) {
    updated.cell_name = requireString_(data.cell_name, "cell_name");
    assertUniqueCellName_(updated.cell_name, cellId);
  }
  if (data.active !== undefined) {
    updated.active = toBoolean_(data.active);
  }
  if (data.sort_order !== undefined) {
    updated.sort_order = requireSortOrder_(data.sort_order);
  }
  updated.updated_at = getNowString_();

  upsertSheetRecordById_(SHEET_NAMES.CELLS, "cell_id", updated);
  writeAuditLog_(
    toBoolean_(existing.active) && !toBoolean_(updated.active)
      ? "delete"
      : "update",
    "cells",
    cellId,
    admin.user_id,
    {
      active: toBoolean_(existing.active),
      sort_order: toNumber_(existing.sort_order, 0),
    },
    {
      active: toBoolean_(updated.active),
      sort_order: toNumber_(updated.sort_order, 0),
    },
    "Cell updated."
  );
  return normalizeManagedCell_(updated);
}

function normalizeManagedCell_(cell) {
  return {
    cell_id: String(cell.cell_id),
    cell_name: String(cell.cell_name),
    active: toBoolean_(cell.active),
    sort_order: toNumber_(cell.sort_order, 0),
    created_at: String(cell.created_at || ""),
    updated_at: String(cell.updated_at || ""),
  };
}

function assertUniqueCellName_(cellName, excludedCellId) {
  var normalized = normalizeEmail_(cellName);
  var duplicate = readSheetRecords_(SHEET_NAMES.CELLS).some(function (cell) {
    return (
      String(cell.cell_id) !== String(excludedCellId) &&
      normalizeEmail_(cell.cell_name) === normalized
    );
  });
  if (duplicate) {
    throw new AppError(ERROR_CODES.CONFLICT, "Cell name is already in use.");
  }
}

function requireSortOrder_(value) {
  var sortOrder = Number(value);
  if (!Number.isFinite(sortOrder)) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "sort_order must be a number.");
  }
  return sortOrder;
}

function getNextCellSortOrder_(cells) {
  return (
    cells.reduce(function (maximum, cell) {
      return Math.max(maximum, toNumber_(cell.sort_order, 0));
    }, 0) + 10
  );
}
