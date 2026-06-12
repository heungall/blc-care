var ERROR_CODES = Object.freeze({
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  CONFIG_ERROR: "CONFIG_ERROR",
  SHEET_NOT_FOUND: "SHEET_NOT_FOUND",
  INVALID_SHEET: "INVALID_SHEET",
  INTERNAL_ERROR: "INTERNAL_ERROR",
});

/**
 * Expected application error that may be returned to the client.
 */
function AppError(code, message) {
  this.name = "AppError";
  this.code = code;
  this.message = message;
  this.stack = new Error(message).stack;
}

AppError.prototype = Object.create(Error.prototype);
AppError.prototype.constructor = AppError;
