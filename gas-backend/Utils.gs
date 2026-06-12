var APP_TIME_ZONE = "Asia/Seoul";

function parseRequest_(method, event) {
  var request = {};
  var parameters = (event && event.parameter) || {};

  if (method === "POST" && event && event.postData && event.postData.contents) {
    try {
      request = JSON.parse(event.postData.contents);
    } catch (error) {
      throw new AppError(
        ERROR_CODES.BAD_REQUEST,
        "요청 본문은 올바른 JSON이어야 합니다."
      );
    }
  }

  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new AppError(
      ERROR_CODES.BAD_REQUEST,
      "요청 본문은 JSON 객체여야 합니다."
    );
  }

  request.action = request.action || parameters.action;
  request.requestUser = request.requestUser || {};
  request.requestUser.email =
    request.requestUser.email || parameters.email || "";
  request.data = request.data || {};

  if (method === "GET") {
    Object.keys(parameters).forEach(function (key) {
      if (key !== "action" && key !== "email" && request.data[key] === undefined) {
        request.data[key] = parameters[key];
      }
    });
  }

  if (!request.action) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "action이 필요합니다.");
  }

  return request;
}

function getRequestData_(request) {
  if (
    !request ||
    !request.data ||
    typeof request.data !== "object" ||
    Array.isArray(request.data)
  ) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "data는 JSON 객체여야 합니다.");
  }

  return request.data;
}

function normalizeEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function parseCommaSeparated_(value) {
  var seen = {};

  return String(value || "")
    .split(",")
    .map(function (item) {
      return item.trim();
    })
    .filter(function (item) {
      if (!item || seen[item]) {
        return false;
      }
      seen[item] = true;
      return true;
    });
}

function serializeCommaSeparated_(value) {
  return parseCommaSeparated_(Array.isArray(value) ? value.join(",") : value).join(
    ","
  );
}

function toBoolean_(value) {
  if (value === true || value === false) {
    return value;
  }

  return String(value || "").trim().toUpperCase() === "TRUE";
}

function toNumber_(value, fallback) {
  var numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function toPositiveInteger_(value, fallback, maximum) {
  var numberValue = Math.floor(Number(value));

  if (!Number.isFinite(numberValue) || numberValue < 1) {
    return fallback;
  }

  return maximum ? Math.min(numberValue, maximum) : numberValue;
}

function cleanRecord_(record) {
  return Object.keys(record).reduce(function (cleaned, key) {
    if (record[key] !== "" && record[key] !== null && record[key] !== undefined) {
      cleaned[key] = record[key];
    }
    return cleaned;
  }, {});
}

function getTodayString_() {
  return Utilities.formatDate(new Date(), APP_TIME_ZONE, "yyyy-MM-dd");
}

function getNowString_() {
  return Utilities.formatDate(new Date(), APP_TIME_ZONE, "yyyy-MM-dd HH:mm:ss");
}

function normalizeDateString_(value) {
  return String(value || "").trim().slice(0, 10);
}

function requireDateString_(value, fieldName) {
  var normalized = normalizeDateString_(value);
  var match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    throw new AppError(
      ERROR_CODES.BAD_REQUEST,
      fieldName + "은 YYYY-MM-DD 형식이어야 합니다."
    );
  }

  var date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );
  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() !== Number(match[2]) - 1 ||
    date.getUTCDate() !== Number(match[3])
  ) {
    throw new AppError(
      ERROR_CODES.BAD_REQUEST,
      fieldName + "이 올바른 날짜가 아닙니다."
    );
  }

  return normalized;
}

function addDays_(value, days) {
  var normalized = requireDateString_(value, "날짜");
  var parts = normalized.split("-");
  var date = new Date(
    Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  );
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getWeekRange_(value) {
  var normalized = requireDateString_(value, "기준일");
  var parts = normalized.split("-");
  var date = new Date(
    Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  );
  var day = date.getUTCDay();
  var daysFromMonday = day === 0 ? 6 : day - 1;
  var weekStartDate = addDays_(normalized, -daysFromMonday);

  return {
    week_start_date: weekStartDate,
    week_end_date: addDays_(weekStartDate, 6),
  };
}

function createId_(prefix) {
  return prefix + "_" + Utilities.getUuid().replace(/-/g, "");
}

function requireString_(value, fieldName) {
  var normalized = String(value || "").trim();
  if (!normalized) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, fieldName + " is required.");
  }
  return normalized;
}

function assertAllowedValue_(value, allowedValues, fieldName) {
  if (allowedValues.indexOf(value) < 0) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, fieldName + " is invalid.");
  }
}

function optionalBoolean_(value) {
  return value === undefined || value === null || value === ""
    ? null
    : toBoolean_(value);
}

function copyRecord_(record) {
  return Object.assign({}, record);
}

function isDateWithinRange_(date, startDate, endDate) {
  var normalizedStart = normalizeDateString_(startDate);
  var normalizedEnd = normalizeDateString_(endDate);

  return (
    (!normalizedStart || normalizedStart <= date) &&
    (!normalizedEnd || normalizedEnd >= date)
  );
}
