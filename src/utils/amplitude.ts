import * as amplitude from "@amplitude/analytics-browser";

export const initAmplitude = () => {
  amplitude.init("fd3846e9e235a99e336ee61b72e08f0b", {
    defaultTracking: true,
  });
};

export const logEvent = (
  eventName: string,
  eventProperties?: Record<string, any>
) => {
  amplitude.track(eventName, eventProperties);
};
