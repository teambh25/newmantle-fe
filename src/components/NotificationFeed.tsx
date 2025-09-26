interface Notification {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'update' | 'notice' | 'event';
}

const notifications: Notification[] = [
  {
    id: '1',
    title: '포기하기 버튼 관련 버그 수정 완료 및 사과문',
    content: '뉴맨틀을 플레이해주시는 여러분 안녕하세요, 뉴맨틀 운영자입니다.\n\n최근 서비스에 버그가 생겨 혼란을 겪으신 분들께 사과드립니다.\n\n9월 9일 이후 플레이 했을 때 포기하기 버튼을 눌렀을 때 정답이 초성으로 표시되는 버그가 있었습니다. 예를 들어 맞혀야 하는 단어가 \'선물\'이였다면 포기하기를 눌렀을 때 \'ㅅㅁ\'로 표시되었습니다. 현재 이 버그는 수정되었으며, 이제 포기하기 버튼을 누르면 정답 단어가 제대로 표시됩니다.\n\n원인은 팀 내에서 최근 진행한 서버를 이전하는 과정에 있습니다. 포기하기와 관련된 서버 호출 방식을 변경하는 과정에서 개발 상의 착오가 있었습니다. 또, 배포 이후 게임 전 기능에 대한 테스트를 소홀히 하여 문제 발생을 뒤늦게 인지하였습니다. 앞으로 이런 실수가 반복되지 않도록 개발 과정에서 테스트를 엄격히 진행하겠습니다.\n\n다시 한번 게임에서 불편함을 느끼셨을 분들에게 죄송합니다.',
    date: '2024-09-23',
    type: 'notice'
  },
  {
    id: '2',
    title: '정답 초성 힌트 제공',
    content: '힌트를 다 써도 문제가 너무 어려워서 포기하신 분들을 위해 정답의 초성 힌트를 제공합니다. 정답 초성 힌트는 포기하기 버튼을 누르면 확인할 수 있습니다.',
    date: '2024-09-26',
    type: 'update'
  }
];

const getTypeColor = (type: Notification['type']) => {
  switch (type) {
    case 'update':
      return 'bg-green-100 text-green-800';
    case 'notice':
      return 'bg-blue-100 text-blue-800';
    case 'event':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTypeLabel = (type: Notification['type']) => {
  switch (type) {
    case 'update':
      return '업데이트';
    case 'notice':
      return '공지';
    case 'event':
      return '이벤트';
    default:
      return '알림';
  }
};

export default function NotificationFeed() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-16">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">공지사항</h2>
      <div className="space-y-4">
        {notifications
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map((notification) => (
          <div
            key={notification.id}
            className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
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
                <span className="text-sm text-gray-500">{notification.date}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {notification.title}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{notification.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}