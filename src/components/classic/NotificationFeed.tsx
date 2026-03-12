import { notifications, Notification } from "@/static/notifications";
import { useNotifications } from "@/hooks/useNotifications";

const getTypeColor = (type: Notification["type"]) => {
  switch (type) {
    case "update":
      return "bg-green-100 text-green-800";
    case "notice":
      return "bg-blue-100 text-blue-800";
    case "event":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getTypeLabel = (type: Notification["type"]) => {
  switch (type) {
    case "update":
      return "업데이트";
    case "notice":
      return "공지";
    case "event":
      return "이벤트";
    default:
      return "알림";
  }
};

export default function NotificationFeed() {
  const { isNew } = useNotifications();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800 text-left">
        공지사항
      </h2>
      <div className="space-y-4">
        {[...notifications]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((notification) => {
            const showNewBadge = isNew(notification.date);
            
            return (
              <div
                key={notification.id}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                        notification.type
                      )}`}
                    >
                      {getTypeLabel(notification.type)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-500">
                        {notification.date}
                      </span>
                      {showNewBadge && (
                        <span className="flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                          N
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {notification.title}
                </h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {notification.content}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}
