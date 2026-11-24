"use client";

import { useEffect } from "react";
import { initAmplitude, setUserProperties } from "@/utils/amplitude";
import { createClient } from "@/utils/supabase/client";
import * as amplitude from "@amplitude/analytics-browser";

const GUEST_ID_KEY = "newmantle_guest_id";

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        amplitude.setUserId(session.user.id);
      }
      setUserProperties({ logged_in: Boolean(session?.user) });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        amplitude.setUserId(session.user.id);
      } else {
        amplitude.setUserId(undefined);
      }
      setUserProperties({ logged_in: Boolean(session?.user) });
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
