/**
 * Verifies an active user by requestUser.email and returns current assignments.
 */
function verifyUser(request) {
  var user = requireAuthenticatedUser_(request);

  return {
    user_id: user.user_id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    active: true,
    assigned_cells: user.assigned_cells,
  };
}

/**
 * Returns a verified user context for protected API handlers.
 */
function requireAuthenticatedUser_(request) {
  assertTrustedProxy_(request);
  var email = normalizeEmail_(
    request && request.requestUser && request.requestUser.email
  );

  if (!email) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "로그인이 필요합니다.");
  }

  var userRecord = findUserByEmail_(email);

  if (!userRecord) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "등록되지 않은 계정입니다.");
  }

  if (!toBoolean_(userRecord.active)) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "비활성화된 계정입니다.");
  }

  return {
    user_id: String(userRecord.user_id),
    email: normalizeEmail_(userRecord.email),
    name: String(userRecord.name),
    roles: parseCommaSeparated_(userRecord.roles),
    active: true,
    assigned_cells: getAssignedCellsForUser_(userRecord.user_id),
  };
}

function assertTrustedProxy_(request) {
  var suppliedSecret = String((request && request.proxySecret) || "");
  if (!suppliedSecret || suppliedSecret !== getApiProxySecret_()) {
    throw new AppError(ERROR_CODES.UNAUTHORIZED, "Trusted API proxy is required.");
  }
}

function requireAdmin_(request) {
  var user = requireAuthenticatedUser_(request);
  if (!hasRole_(user, "admin")) {
    throw new AppError(ERROR_CODES.FORBIDDEN, "Admin role is required.");
  }
  return user;
}

function hasRole_(user, role) {
  return user.roles.indexOf(role) >= 0;
}

function getAssignedCellIds_(user) {
  return user.assigned_cells.map(function (cell) {
    return cell.cell_id;
  });
}

function canAccessCell_(user, cellId) {
  return (
    hasRole_(user, "admin") ||
    (hasRole_(user, "cell_leader") &&
      getAssignedCellIds_(user).indexOf(cellId) >= 0)
  );
}

function assertCanAccessCell_(user, cellId) {
  if (!cellId || !canAccessCell_(user, String(cellId))) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "이 셀의 데이터에 접근할 권한이 없습니다."
    );
  }
}

function assertCanAccessMember_(user, member) {
  if (!member || !canAccessCell_(user, String(member.current_cell_id || ""))) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "이 성도 정보에 접근할 권한이 없습니다."
    );
  }
}

function assertCanReadMembers_(user) {
  if (!hasRole_(user, "admin") && !hasRole_(user, "cell_leader")) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "성도 정보를 조회할 권한이 없습니다."
    );
  }
}

function assertCanReadReports_(user) {
  if (!hasRole_(user, "admin") && !hasRole_(user, "cell_leader")) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "리포트를 조회할 권한이 없습니다."
    );
  }
}

function assertCanEditReport_(user, report) {
  if (hasRole_(user, "admin")) {
    return;
  }

  if (
    !hasRole_(user, "cell_leader") ||
    !canAccessCell_(user, String(report.cell_id)) ||
    toBoolean_(report.locked) ||
    String(report.status) === "locked" ||
    !isDateWithinRange_(
      getTodayString_(),
      report.week_start_date,
      report.week_end_date
    )
  ) {
    throw new AppError(
      ERROR_CODES.FORBIDDEN,
      "이 리포트를 수정할 권한이 없거나 수정 가능 기간이 지났습니다."
    );
  }
}
