// 퀴즈 날짜는 한국 시간 기준이므로 접속 지역과 무관하게 KST 날짜(YYYY-MM-DD)를 반환한다.
export function getKSTDateString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// "2026-11-10" → "Tue Nov 10 2026" (이전 버전의 lastPlayedDate 형식)
// Z 없는 날짜·시각 문자열은 로컬 자정으로 해석되므로, 기기 타임존과 무관하게 같은 달력 날짜가 나온다.
export function toLegacyDateString(dateString: string): string {
  return new Date(`${dateString}T00:00:00`).toDateString();
}

// KST 오늘 날짜를 기기 로컬 자정의 Date로 반환한다.
// date-fns처럼 로컬 기준으로 날짜를 계산·포맷하는 코드에 넘기면 KST 달력 날짜 그대로 다룰 수 있다.
export function getKSTToday(date: Date = new Date()): Date {
  return new Date(`${getKSTDateString(date)}T00:00:00`);
}
