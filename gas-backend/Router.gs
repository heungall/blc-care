/**
 * Routes a Web App request and always returns the common JSON response shape.
 */
function handleRequest_(method, event) {
  try {
    var request = parseRequest_(method, event);

    var routes = {
      verifyUser: verifyUser,
      getMembers: getMembers,
      getMemberDetail: getMemberDetail,
      parsePrayerRequests: parsePrayerRequests,
      getReports: getReports,
      getReportDetail: getReportDetail,
      getWeeklyReportDraft: getWeeklyReportDraft,
      saveWeeklyReport: saveWeeklyReport,
      getUsers: getUsers,
      createUser: createUser,
      updateUser: updateUser,
      assignUserToCell: assignUserToCell,
      unassignUserFromCell: unassignUserFromCell,
      getCells: getCells,
      createCell: createCell,
      updateCell: updateCell,
      createNewcomer: createNewcomer,
      getNewcomers: getNewcomers,
      updateNewcomerStatus: updateNewcomerStatus,
      convertNewcomerToMember: convertNewcomerToMember,
      getAbsenceAlerts: getAbsenceAlerts,
      updateAbsenceAlert: updateAbsenceAlert,
      getSettings: getSettings,
      updateSettings: updateSettings,
      getBackupHistory: getBackupHistory,
      createBackup: createBackup,
    };
    var handler = routes[request.action];

    if (
      Object.prototype.hasOwnProperty.call(routes, request.action) &&
      typeof handler === "function"
    ) {
      return jsonResponse_(successResponse(handler(request)));
    }

    throw new AppError(
      ERROR_CODES.NOT_FOUND,
      "지원하지 않는 API action입니다."
    );
  } catch (error) {
    return jsonResponse_(toErrorResponse_(error));
  }
}
