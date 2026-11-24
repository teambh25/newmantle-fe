import * as amplitude from "@amplitude/analytics-browser";

export const initAmplitude = () => {
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  if (!apiKey) return;

  // 유입 경로(identify, 한도 미포함)만 남기고 자동 수집은 끈다. 원격 설정(Autocapture)이 켜져 있으면 이 값을 덮어쓴다
  // autocapture는 SDK가 읽지만 이 버전의 타입 정의에 없어서, 객체를 변수로 빼서 넘긴다
  const options = {
    autocapture: false,
    defaultTracking: {
      attribution: true,
      pageViews: false,
      sessions: false,
      formInteractions: false,
      fileDownloads: false,
    },
  };
  amplitude.init(apiKey, options);
};

export const logEvent = (
  eventName: string,
  eventProperties?: Record<string, any>
) => {
  amplitude.track(eventName, eventProperties);
};

/** 사용자 속성을 identify 한 번으로 보낸다. identify는 월 이벤트 한도에 들어가지 않는다 (docs/rules/amplitude.md 3장) */
export const setUserProperties = (properties: Record<string, string | number | boolean>) => {
  const identify = new amplitude.Identify();
  for (const [name, value] of Object.entries(properties)) {
    identify.set(name, value);
  }
  amplitude.identify(identify);
};
