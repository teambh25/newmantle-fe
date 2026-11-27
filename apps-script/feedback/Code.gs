/**
 * 뉴맨틀 피드백 웹앱 (docs/specs/feedback-migration)
 * 브라우저가 보낸 피드백 한 건을 시트에 한 행으로 적고, 디스코드로 알린다.
 *
 * 배포 (저장소의 이 파일이 원본이다. 편집기에서 고치지 말고 여기서 고쳐 붙여 넣는다, Dec-13)
 * 1. 새 스프레드시트 파일을 만들고 탭 이름을 SHEET_NAME으로 바꾼다. 1행에 HEADERS 값을 적는다 (순서·추가 컬럼은 자유)
 *    처리 완료는 DONE_HEADER 이름의 컬럼을 두면 새 행마다 빈 체크박스가 들어간다. 체크박스를 아래로 미리 깔아 두지 않는다 (새 행이 그 아래에 붙는다)
 * 2. 파일 → 설정 → 일반 → 시간대를 "(GMT+09:00) 서울"로 둔다 (received_at 표시용)
 * 3. 확장 프로그램 → Apps Script에 이 파일 내용을 붙여 넣는다
 * 4. 프로젝트 설정 → 스크립트 속성에 DISCORD_WEBHOOK_URL을 넣는다 (저장소에 두지 않는다, Dec-6)
 * 5. 배포 → 새 배포 → 웹앱. 실행 계정: 나, 액세스: 모든 사용자
 *    코드를 고친 뒤에는 "배포 관리"에서 기존 배포의 버전을 올린다. 새 배포를 만들면 URL이 바뀐다
 *
 * 요청: POST, Content-Type text/plain, 본문은 JSON 문자열 (Dec-2)
 *   { feedback, quiz_date, game_status, user_type, subject_id }
 * 응답: { "ok": true } 또는 { "ok": false }. 프론트는 ok가 아니면 Sentry로 보고한다 (Dec-4)
 */

const SHEET_NAME = "feedback";
const MAX_LENGTH = 500;
const DISCORD_MAX_LENGTH = 2000;

/** 시트 1행의 헤더 이름. 값은 헤더 이름을 찾아 넣으므로 컬럼 순서를 바꾸거나 사람이 채우는 컬럼을 더해도 된다 (Dec-12) */
const HEADERS = {
  receivedAt: "received_at",
  userType: "user_type",
  subjectId: "subject_id",
  quizDate: "quiz_date",
  gameStatus: "game_status",
  feedback: "feedback",
};

/** 사람이 처리 완료를 표시하는 컬럼. 있으면 새 행마다 빈 체크박스를 넣는다 (Dec-12) */
const DONE_HEADER = "done";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GAME_STATUSES = ["playing", "solved", "given_up"];
const USER_TYPES = ["user", "guest"];
/** 디스코드 알림 머리줄에 쓰는 게임 상태 이름 (Dec-6) */
const GAME_STATUS_LABELS = { playing: "진행 중", solved: "정답", given_up: "포기" };

function doPost(e) {
  const input = parseInput(e);
  // 형식이 틀린 요청은 디스코드에 알리지 않는다. 누구나 보낼 수 있는 주소라 알림이 스팸 통로가 된다 (Dec-5)
  if (!input) return respond(false);

  try {
    appendFeedback(input);
  } catch (error) {
    notifyDiscord("피드백 저장 실패: " + error.message);
    return respond(false);
  }
  // 알림이 실패해도 저장은 성공으로 본다 (Dec-6)
  notifyDiscord(formatNotification(input));
  return respond(true);
}

/** 형식이 맞으면 값을 돌려주고, 아니면 null. 값 자체가 참인지는 검증하지 않는다 (Dec-11) */
function parseInput(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    return reject("JSON이 아님");
  }
  if (!data || typeof data !== "object") return reject("객체가 아님");

  const feedback = typeof data.feedback === "string" ? data.feedback.trim() : "";
  if (feedback.length === 0 || feedback.length > MAX_LENGTH) return reject("feedback 길이 " + feedback.length);
  if (!DATE_PATTERN.test(String(data.quiz_date))) return reject("quiz_date 형식");
  if (GAME_STATUSES.indexOf(data.game_status) === -1) return reject("game_status 값");
  if (USER_TYPES.indexOf(data.user_type) === -1) return reject("user_type 값");
  if (!UUID_PATTERN.test(String(data.subject_id))) return reject("subject_id 형식");

  return {
    feedback: feedback,
    quizDate: data.quiz_date,
    gameStatus: data.game_status,
    userType: data.user_type,
    subjectId: data.subject_id,
  };
}

/** 거절 이유는 Apps Script 실행 기록에만 남긴다. 값은 남기지 않는다 */
function reject(reason) {
  console.warn("요청 거절: " + reason);
  return null;
}

function appendFeedback(input) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("'" + SHEET_NAME + "' 탭이 없음");

  if (sheet.getLastColumn() === 0) throw new Error("1행에 헤더가 없음");
  // 헤더 앞뒤 공백은 무시한다
  const headerRow = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(function (header) {
      return String(header).trim();
    });
  const values = {
    receivedAt: new Date(),
    quizDate: input.quizDate,
    userType: input.userType,
    subjectId: input.subjectId,
    gameStatus: input.gameStatus,
    // 본문이 =, +, -, @로 시작하면 시트가 수식으로 읽는다. 글자 그대로 적히게 막는다 (Dec-17)
    feedback: asPlainText(input.feedback),
  };

  const row = headerRow.map(function () {
    return "";
  });
  const missing = Object.keys(HEADERS).filter(function (key) {
    return headerRow.indexOf(HEADERS[key]) === -1;
  });
  if (missing.length > 0) {
    throw new Error(
      "헤더가 없음: " +
        missing
          .map(function (key) {
            return HEADERS[key];
          })
          .join(", ")
    );
  }
  Object.keys(HEADERS).forEach(function (key) {
    row[headerRow.indexOf(HEADERS[key])] = values[key];
  });
  sheet.appendRow(row);

  // 체크박스를 아래로 미리 깔면 appendRow가 그 아래에 붙으므로, 새 행에만 넣는다
  const doneColumn = headerRow.indexOf(DONE_HEADER);
  if (doneColumn !== -1) sheet.getRange(sheet.getLastRow(), doneColumn + 1).insertCheckboxes();
}

function asPlainText(text) {
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function formatNotification(input) {
  // allowed_mentions에 더해, @ 뒤에 폭 없는 공백을 넣어 멘션 문법 자체를 깨뜨린다 (Dec-6)
  const message =
    "**" + input.quizDate + " 퀴즈 · " + GAME_STATUS_LABELS[input.gameStatus] + "**\n" +
    input.feedback.replace(/@/g, "@\u200b");
  return message.length > DISCORD_MAX_LENGTH ? message.slice(0, DISCORD_MAX_LENGTH - 1) + "…" : message;
}

/** 실패해도 던지지 않는다. 원인은 Apps Script 실행 기록에서 본다 */
function notifyDiscord(content) {
  const url = PropertiesService.getScriptProperties().getProperty("DISCORD_WEBHOOK_URL");
  if (!url) {
    console.warn("DISCORD_WEBHOOK_URL 스크립트 속성이 없음");
    return;
  }
  try {
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      // 본문 속 @everyone 등이 멘션되지 않게 한다 (Dec-6)
      payload: JSON.stringify({ content: content, allowed_mentions: { parse: [] } }),
      muteHttpExceptions: true,
    });
    if (response.getResponseCode() >= 300) {
      console.error("디스코드 알림 실패: " + response.getResponseCode());
    }
  } catch (error) {
    console.error("디스코드 알림 실패: " + error.message);
  }
}

function respond(ok) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok })).setMimeType(
    ContentService.MimeType.JSON
  );
}
