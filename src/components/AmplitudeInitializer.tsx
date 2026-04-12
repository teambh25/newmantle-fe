"use client";

import { useEffect } from "react";
import { initAmplitude } from "@/utils/amplitude";
import { createClient } from "@/utils/supabase/client";
import * as amplitude from "@amplitude/analytics-browser";

export default function AmplitudeInitializer() {
  useEffect(() => {
    initAmplitude();

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        amplitude.setUserId(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        amplitude.setUserId(session.user.id);
      } else {
        amplitude.setUserId(undefined);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
