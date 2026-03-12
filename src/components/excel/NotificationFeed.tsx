import { notifications } from "@/static/notifications";
import { useNotifications } from "@/hooks/useNotifications";

const getTypeColor = (type: string) => {
  switch (type) {
    case "update":
      return "bg-[#e2efda] text-[#217346] border-[#217346]";
    case "notice":
      return "bg-[#ddebf7] text-[#2f5597] border-[#2f5597]";
    default:
      return "bg-[#f2f2f2] text-[#595959] border-[#595959]";
  }
};

interface NotificationFeedProps {
  startRow?: number;
}

const NotificationItem = ({ 
  notification, 
  startRow, 
  index, 
  isNew 
}: { 
  notification: any, 
  startRow: number, 
  index: number,
  isNew: boolean
}) => {
  return (
    <div className="excel-row bg-white">
      <div className="sheet-cell-header pt-2 pb-2">{startRow + index + 1}</div>
      <div className="excel-cell col-span-4 border-r-0 flex flex-col items-start justify-start py-4 px-5">
        <div className="flex items-center space-x-3 mb-2">
          <span className={`px-2 py-0.5 border text-[11px] font-medium ${getTypeColor(notification.type)}`}>
            {notification.type === 'update' ? '업데이트' : notification.type === 'notice' ? '공지' : '이벤트'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-500 font-mono">
              {notification.date}
            </span>
            {isNew && (
              <span className="flex items-center justify-center w-3.5 h-3.5 bg-[#c00000] text-white text-[9px] font-bold rounded-full">
                N
              </span>
            )}
          </div>
        </div>
        <h3 className="text-[14px] font-bold text-gray-800 mb-2">
          {notification.title}
        </h3>
        <p className="text-[13px] text-gray-700 whitespace-pre-line leading-relaxed max-w-full">
          {notification.content}
        </p>
      </div>
    </div>
  );
};

export default function NotificationFeed({ startRow = 30 }: NotificationFeedProps) {
  const { isNew } = useNotifications();

  return (
    <>
      <div className="excel-row bg-white">
        <div className="sheet-cell-header bg-[#e2e2e2] font-bold text-[#217346]">{startRow}</div>
        <div className="excel-cell col-span-4 flex items-center justify-start font-bold text-[13px] text-[#217346] bg-[#e6f2eb]">
          공지사항
        </div>
      </div>

      {[...notifications]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((notification, index) => (
          <NotificationItem 
            key={notification.id} 
            notification={notification} 
            startRow={startRow} 
            index={index}
            isNew={isNew(notification.date)}
          />
        ))}
    </>
  );
}
