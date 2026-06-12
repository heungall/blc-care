var USER_ROLES = Object.freeze(["admin", "cell_leader"]);
var ASSIGNMENT_ROLES = Object.freeze(["leader", "assistant"]);

function getUsers(request) {
  requireAdmin_(request);
  var data = getRequestData_(request);
  var active = optionalBoolean_(data.active);
  var keyword = normalizeEmail_(data.keyword);
  var assignments = readSheetRecords_(SHEET_NAMES.USER_CELL_ASSIGNMENTS);
  var cellsById = getCellsById_();

  var users = readSheetRecords_(SHEET_NAMES.USERS)
    .filter(function (user) {
      if (active !== null && toBoolean_(user.active) !== active) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return (
        normalizeEmail_(user.name).indexOf(keyword) >= 0 ||
        normalizeEmail_(user.email).indexOf(keyword) >= 0
      );
    })
    .map(function (user) {
      return normalizeManagedUser_(user, assignments, cellsById);
    })
    .sort(function (left, right) {
      return left.name.localeCompare(right.name, "ko");
    });

  return { items: users };
}

function createUser(request) {
  var admin = requireAdmin_(request);
  var data = getRequestData_(request);
  var email = normalizeEmail_(requireString_(data.email, "email"));
  var roles = validateUserRoles_(data.roles);
  assertUniqueUserEmail_(email, "");

  var now = getNowString_();
  var user = {
    user_id: createId_("user"),
    email: email,
    name: requireString_(data.name, "name"),
    roles: serializeCommaSeparated_(roles),
    active: data.active === undefined ? true : toBoolean_(data.active),
    created_at: now,
    updated_at: now,
  };
  upsertSheetRecordById_(SHEET_NAMES.USERS, "user_id", user);
  writeAuditLog_(
    "create",
    "users",
    user.user_id,
    admin.user_id,
    "",
    { roles: roles, active: user.active },
    "User created."
  );

  return normalizeManagedUser_(user, [], {});
}

function updateUser(request) {
  var admin = requireAdmin_(request);
  var data = getRequestData_(request);
  var userId = requireString_(data.user_id, "user_id");
  var existing = requireRecordById_(
    SHEET_NAMES.USERS,
    "user_id",
    userId,
    "User"
  );
  var updated = copyRecord_(existing);
  var before = {
    roles: parseCommaSeparated_(existing.roles),
    active: toBoolean_(existing.active),
  };

  if (data.email !== undefined) {
    updated.email = normalizeEmail_(requireString_(data.email, "email"));
    assertUniqueUserEmail_(updated.email, userId);
  }
  if (data.name !== undefined) {
    updated.name = requireString_(data.name, "name");
  }
  if (data.roles !== undefined) {
    updated.roles = serializeCommaSeparated_(validateUserRoles_(data.roles));
  }
  if (data.active !== undefined) {
    updated.active = toBoolean_(data.active);
  }
  updated.updated_at = getNowString_();

  upsertSheetRecordById_(SHEET_NAMES.USERS, "user_id", updated);
  writeAuditLog_(
    "update",
    "users",
    userId,
    admin.user_id,
    before,
    {
      roles: parseCommaSeparated_(updated.roles),
      active: toBoolean_(updated.active),
    },
    "User updated."
  );

  return normalizeManagedUser_(
    updated,
    readSheetRecords_(SHEET_NAMES.USER_CELL_ASSIGNMENTS),
    getCellsById_()
  );
}

function assignUserToCell(request) {
  var admin = requireAdmin_(request);
  var data = getRequestData_(request);
  var userId = requireString_(data.user_id, "user_id");
  var cellId = requireString_(data.cell_id, "cell_id");
  var assignmentRole = String(data.assignment_role || "leader").trim();
  assertAllowedValue_(assignmentRole, ASSIGNMENT_ROLES, "assignment_role");
  requireRecordById_(SHEET_NAMES.USERS, "user_id", userId, "User");
  assertActiveCellExists_(cellId);

  var matches = readSheetRecords_(SHEET_NAMES.USER_CELL_ASSIGNMENTS).filter(
    function (assignment) {
      return (
        String(assignment.user_id) === userId &&
        String(assignment.cell_id) === cellId
      );
    }
  );
  if (matches.length > 1) {
    throw new AppError(
      ERROR_CODES.CONFLICT,
      "Duplicate user and cell assignments exist."
    );
  }
  var existing = matches[0] || null;
  var now = getNowString_();
  var assignment = existing
    ? copyRecord_(existing)
    : {
        assignment_id: createId_("assignment"),
        user_id: userId,
        cell_id: cellId,
        created_at: now,
      };

  assignment.assignment_role = assignmentRole;
  assignment.active = true;
  assignment.start_date = data.start_date
    ? requireDateString_(data.start_date, "start_date")
    : getTodayString_();
  assignment.end_date = "";
  assignment.updated_at = now;
  upsertSheetRecordById_(
    SHEET_NAMES.USER_CELL_ASSIGNMENTS,
    "assignment_id",
    assignment
  );
  writeAuditLog_(
    existing ? "update" : "create",
    "user_cell_assignments",
    assignment.assignment_id,
    admin.user_id,
    existing
      ? { user_id: userId, cell_id: cellId, active: toBoolean_(existing.active) }
      : "",
    {
      user_id: userId,
      cell_id: cellId,
      assignment_role: assignmentRole,
      active: true,
    },
    "User assigned to cell."
  );

  return normalizeAssignment_(assignment);
}

function unassignUserFromCell(request) {
  var admin = requireAdmin_(request);
  var data = getRequestData_(request);
  var assignmentId = requireString_(data.assignment_id, "assignment_id");
  var existing = requireRecordById_(
    SHEET_NAMES.USER_CELL_ASSIGNMENTS,
    "assignment_id",
    assignmentId,
    "Assignment"
  );
  var updated = copyRecord_(existing);
  updated.active = false;
  updated.end_date = data.end_date
    ? requireDateString_(data.end_date, "end_date")
    : getTodayString_();
  updated.updated_at = getNowString_();

  upsertSheetRecordById_(
    SHEET_NAMES.USER_CELL_ASSIGNMENTS,
    "assignment_id",
    updated
  );
  writeAuditLog_(
    "delete",
    "user_cell_assignments",
    assignmentId,
    admin.user_id,
    { user_id: existing.user_id, cell_id: existing.cell_id, active: true },
    { user_id: existing.user_id, cell_id: existing.cell_id, active: false },
    "User unassigned from cell."
  );

  return normalizeAssignment_(updated);
}

function normalizeManagedUser_(user, assignments, cellsById) {
  var today = getTodayString_();
  return {
    user_id: String(user.user_id),
    email: normalizeEmail_(user.email),
    name: String(user.name),
    roles: parseCommaSeparated_(user.roles),
    active: toBoolean_(user.active),
    assigned_cells: assignments
      .filter(function (assignment) {
        return (
          String(assignment.user_id) === String(user.user_id) &&
          toBoolean_(assignment.active) &&
          isDateWithinRange_(today, assignment.start_date, assignment.end_date)
        );
      })
      .map(function (assignment) {
        var cell = cellsById[String(assignment.cell_id)] || {};
        return {
          assignment_id: String(assignment.assignment_id),
          cell_id: String(assignment.cell_id),
          cell_name: String(cell.cell_name || ""),
          assignment_role: String(assignment.assignment_role),
        };
      }),
    created_at: String(user.created_at || ""),
    updated_at: String(user.updated_at || ""),
  };
}

function normalizeAssignment_(assignment) {
  return {
    assignment_id: String(assignment.assignment_id),
    user_id: String(assignment.user_id),
    cell_id: String(assignment.cell_id),
    assignment_role: String(assignment.assignment_role),
    active: toBoolean_(assignment.active),
    start_date: String(assignment.start_date || ""),
    end_date: String(assignment.end_date || ""),
    created_at: String(assignment.created_at || ""),
    updated_at: String(assignment.updated_at || ""),
  };
}

function validateUserRoles_(roles) {
  var normalized = parseCommaSeparated_(
    Array.isArray(roles) ? roles.join(",") : roles
  );
  if (!normalized.length) {
    throw new AppError(
      ERROR_CODES.BAD_REQUEST,
      "roles must include at least one role."
    );
  }
  normalized.forEach(function (role) {
    assertAllowedValue_(role, USER_ROLES, "roles");
  });
  return normalized;
}

function assertUniqueUserEmail_(email, excludedUserId) {
  var duplicate = readSheetRecords_(SHEET_NAMES.USERS).some(function (user) {
    return (
      String(user.user_id) !== String(excludedUserId) &&
      normalizeEmail_(user.email) === email
    );
  });
  if (duplicate) {
    throw new AppError(ERROR_CODES.CONFLICT, "Email is already in use.");
  }
}

function requireRecordById_(sheetName, idColumn, id, label) {
  var record = findRecordById_(sheetName, idColumn, id);
  if (!record) {
    throw new AppError(ERROR_CODES.NOT_FOUND, label + " not found.");
  }
  return record;
}
