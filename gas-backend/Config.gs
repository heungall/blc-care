var CONFIG_KEYS = Object.freeze({
  SHEET_ID: "SHEET_ID",
  API_PROXY_SECRET: "API_PROXY_SECRET",
});

/**
 * Returns a required Script Property without exposing its value to clients.
 */
function getRequiredScriptProperty_(key) {
  var value = PropertiesService.getScriptProperties().getProperty(key);

  if (!value) {
    throw new AppError(
      ERROR_CODES.CONFIG_ERROR,
      "필수 Script Property가 설정되지 않았습니다: " + key
    );
  }

  return value;
}

function getSheetId_() {
  return getRequiredScriptProperty_(CONFIG_KEYS.SHEET_ID);
}

function getApiProxySecret_() {
  return getRequiredScriptProperty_(CONFIG_KEYS.API_PROXY_SECRET);
}
