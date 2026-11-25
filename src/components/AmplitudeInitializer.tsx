"use client";

import { useEffect } from "react";
import { initAmplitude, setUserProperties } from "@/utils/amplitude";
import { getAmplitudeIdentity } from "@/utils/analytics";
import { createClient } from "@/utils/supabase/client";
import { GUEST_ID_KEY } from "@/utils/guestId";
import * as amplitude from "@amplitude/analytics-browser";

function applyIdentity(session: Parameters<typeof getAmplitudeIdentity>[0]) {
  const { userId, loggedIn } = getAmplitudeIdentity(session);
  amplitude.setUserId(userId);
  setUserProperties({ logged_in: loggedIn });
}

export default function AmplitudeInitializer() {
  useEffect(() => {
    initAmplitude();

    // 문의 대응용 게스트 id. 첫 게임 요청 전이면 아직 없다 (docs/rules/amplitude.md 3장, Dec-40)
    try {
      const guestId = localStorage.getItem(GUEST_ID_KEY);
      if (guestId) setUserProperties({ guest_id: guestId });
    } catch {
      // 저장소를 못 쓰면 보내지 않는다
    }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => applyIdentity(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => applyIdentity(session));

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
