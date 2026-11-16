import { notifications } from "@/static/notifications";
import { getTypeColor, getTypeLabel, sortNotifications } from "@/utils/notifications";

// /notices: 전체 공지 목록, 최신순 (docs/tasks/ui/notices/plan.md 1)
export default function NotificationFeed() {
  return (
    <div className="space-y-4">
      {sortNotifications(notifications).map((notification) => (
        <article
          key={notification.id}
          className="border border-gray-200 rounded-lg p-4 bg-white"
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}
            >
              {getTypeLabel(notification.type)}
            </span>
            <span className="text-sm text-gray-500">{notification.date}</span>
          </div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">{notification.title}</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
            {notification.content}
          </p>
        </article>
      ))}
    </div>
  );
}
