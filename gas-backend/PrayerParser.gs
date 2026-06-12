var PRAYER_TITLES = Object.freeze([
  "전도사님",
  "선생님",
  "목사님",
  "리더님",
  "전도사",
  "자매",
  "형제",
  "집사",
  "목사",
  "리더",
  "님",
]);
var PRAYER_DELIMITER_PATTERN = /[:：)\-/]/;

/**
 * Parses prayer text against active members of one authorized cell.
 * This function never writes parsed results to Sheets.
 */
function parsePrayerRequests(request) {
  var user = requireAuthenticatedUser_(request);
  assertCanReadMembers_(user);
  var data = getRequestData_(request);
  var cellId = String(data.cell_id || "").trim();
  var rawText = String(data.raw_text || "");

  if (!cellId) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "cell_id가 필요합니다.");
  }
  if (!rawText.trim()) {
    throw new AppError(ERROR_CODES.BAD_REQUEST, "기도제목을 입력해주세요.");
  }

  assertCanAccessCell_(user, cellId);
  assertActiveCellExists_(cellId);

  var members = readSheetRecords_(SHEET_NAMES.MEMBERS)
    .filter(function (member) {
      return (
        String(member.current_cell_id) === cellId &&
        String(member.status) === "active"
      );
    })
    .map(normalizeMemberRecord_);

  return parsePrayerText_(rawText, members);
}

function parsePrayerText_(rawText, members) {
  var split = splitPrayerLines_(rawText);
  var result = {
    items: [],
    ambiguous: [],
    unmatched: [],
    invalid: split.invalid,
  };

  split.parsed.forEach(function (line) {
    var match = matchPrayerMemberByName_(line.input_name, members);

    if (match.status === "matched") {
      var existing = result.items.filter(function (item) {
        return item.member_id === match.member.member_id;
      })[0];

      if (existing) {
        existing.prayer_request += "\n" + line.prayer_request;
      } else {
        result.items.push({
          input_name: line.input_name,
          member_id: match.member.member_id,
          matched_name: match.member.display_name,
          prayer_request: line.prayer_request,
          status: "matched",
          confidence: match.confidence,
        });
      }
      return;
    }

    if (match.status === "ambiguous") {
      result.ambiguous.push({
        input_name: line.input_name,
        prayer_request: line.prayer_request,
        status: "ambiguous",
        candidates: match.candidates.map(function (member) {
          return {
            member_id: member.member_id,
            display_name: member.display_name,
            full_name: member.full_name,
          };
        }),
      });
      return;
    }

    result.unmatched.push({
      input_name: line.input_name,
      prayer_request: line.prayer_request,
      status: "unmatched",
    });
  });

  return result;
}

function splitPrayerLines_(rawText) {
  var parsed = [];
  var invalid = [];

  String(rawText)
    .split(/\r?\n/)
    .forEach(function (rawLine) {
      var line = rawLine.trim();
      if (!line) {
        return;
      }

      var delimiterIndex = line.search(PRAYER_DELIMITER_PATTERN);
      if (delimiterIndex < 0) {
        if (parsed.length > 0) {
          parsed[parsed.length - 1].prayer_request += "\n" + line;
        } else {
          invalid.push({
            raw_line: line,
            reason: "이름과 기도제목을 구분할 수 없습니다.",
            status: "invalid",
          });
        }
        return;
      }

      var inputName = line.slice(0, delimiterIndex).trim();
      var prayerRequest = line.slice(delimiterIndex + 1).trim();

      if (!inputName || !prayerRequest) {
        invalid.push({
          raw_line: line,
          reason: !inputName
            ? "이름을 찾을 수 없습니다."
            : "기도제목 내용이 비어 있습니다.",
          status: "invalid",
        });
        return;
      }

      parsed.push({
        input_name: inputName,
        prayer_request: prayerRequest,
      });
    });

  return { parsed: parsed, invalid: invalid };
}

function matchPrayerMemberByName_(inputName, members) {
  var input = normalizePrayerName_(inputName);

  if (!input) {
    return { status: "unmatched" };
  }

  var fullMatches = members.filter(function (member) {
    return normalizePrayerName_(member.full_name) === input;
  });
  var fullResult = createPrayerMatchResult_(fullMatches, 1);
  if (fullResult) {
    return fullResult;
  }

  var aliasMatches = members.filter(function (member) {
    return member.name_aliases.some(function (alias) {
      return normalizePrayerName_(alias) === input;
    });
  });
  var aliasResult = createPrayerMatchResult_(aliasMatches, 1);
  if (aliasResult) {
    return aliasResult;
  }

  var suffixMatches = members.filter(function (member) {
    return normalizePrayerName_(member.full_name).slice(-input.length) === input;
  });
  var suffixResult = createPrayerMatchResult_(suffixMatches, 0.9);

  return suffixResult || { status: "unmatched" };
}

function createPrayerMatchResult_(candidates, confidence) {
  if (candidates.length === 1) {
    return {
      status: "matched",
      member: candidates[0],
      confidence: confidence,
    };
  }
  if (candidates.length > 1) {
    return { status: "ambiguous", candidates: candidates };
  }
  return null;
}

function normalizePrayerName_(value) {
  var normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\[\](){}<>*_.,"']/g, "");

  PRAYER_TITLES.some(function (title) {
    if (normalized.slice(-title.length) === title) {
      normalized = normalized.slice(0, -title.length);
      return true;
    }
    return false;
  });

  return normalized;
}

function assertActiveCellExists_(cellId) {
  var cell = findRecordById_(SHEET_NAMES.CELLS, "cell_id", cellId);
  if (!cell || !toBoolean_(cell.active)) {
    throw new AppError(ERROR_CODES.NOT_FOUND, "활성 셀을 찾을 수 없습니다.");
  }
}
