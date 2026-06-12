/**
 * Creates the common success response object.
 */
function successResponse(data) {
  return {
    success: true,
    data: data,
    error: null,
  };
}

/**
 * Creates the common error response object.
 */
function errorResponse(code, message) {
  return {
    success: false,
    data: null,
    error: {
      code: code,
      message: message,
    },
  };
}

/**
 * Converts a response object into a JSON TextOutput.
 */
function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Hides unexpected internal error details from clients.
 */
function toErrorResponse_(error) {
  if (error && error.name === "AppError") {
    return errorResponse(error.code, error.message);
  }

  console.error(error);
  return errorResponse(
    ERROR_CODES.INTERNAL_ERROR,
    "요청 처리 중 오류가 발생했습니다."
  );
}
