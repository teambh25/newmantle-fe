// 공지 정렬·라벨·읽음 판단 (docs/tasks/ui/notices/plan.md)
import type { Notification } from "@/static/notifications";
import { getKSTDateString } from "@/utils/date";

/** 마지막으로 본 공지 id */
export const LAST_SEEN_NOTICE_KEY = "newmantle_last_seen_notification_id";
/** 이전 방식의 마지막 확인 시각 (ISO). excel 공지 목록이 아직 쓴다 */
export const LEGACY_NOTICE_CHECK_KEY = "newmantle_last_notification_check";

const FIRST_VISIT_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 날짜 내림차순, 같은 날짜는 id 내림차순 */
export function sortNotifications(list: Notification[]): Notification[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id));
}

export function getLatestNotification(list: Notification[]): Notification | undefined {
  return sortNotifications(list)[0];
}

export function getTypeLabel(type: Notification["type"]): string {
  switch (type) {
    case "update":
      return "업데이트";
    case "notice":
      return "공지";
    case "incident":
      return "장애";
    default:
      return "알림";
  }
}

/** 메인 띠 라벨: 장애는 띠에서만 부드럽게 "안내" (빨간 띠가 이미 알려줌) */
export function getBannerLabel(type: Notification["type"]): string {
  return isIncident(type) ? "안내" : getTypeLabel(type);
}

/** 색은 주의가 필요한 장애만. 나머지는 무채색 (docs/tasks/ui/notices/plan.md 7) */
export function isIncident(type: Notification["type"]): boolean {
  return type === "incident";
}

/** `/notices` 종류 배지 */
export function getTypeColor(type: Notification["type"]): string {
  return isIncident(type) ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600";
}

interface ReadState {
  lastSeenId: string | null;
  legacyCheck: string | null;
  now: Date;
}

/** 최신 공지를 아직 안 읽었는가 */
export function isLatestUnread(
  list: Notification[],
  { lastSeenId, legacyCheck, now }: ReadState
): boolean {
  const latest = getLatestNotification(list);
  if (!latest) return false;

  if (lastSeenId !== null) {
    return Number(latest.id) > Number(lastSeenId);
  }

  // 기존 키만 있으면 이전 규칙 그대로: 공지 날짜(UTC 자정)가 확인 시각 이후면 안 읽음
  if (legacyCheck !== null) {
    return new Date(latest.date).getTime() > new Date(legacyCheck).getTime();
  }

  // 처음 방문: 최신 공지가 KST 기준 3일 이내면 안 읽음
  const today = new Date(getKSTDateString(now)).getTime();
  const daysAgo = (today - new Date(latest.date).getTime()) / DAY_MS;
  return daysAgo <= FIRST_VISIT_DAYS;
}
