/**
 * Google Apps Script Web App GET entry point.
 */
function doGet(e) {
  return handleRequest_("GET", e);
}

/**
 * Google Apps Script Web App POST entry point.
 */
function doPost(e) {
  return handleRequest_("POST", e);
}
