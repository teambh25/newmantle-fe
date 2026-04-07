'use client';

import { useEffect } from 'react';
import { linkGuestStats } from '@/utils/api';

const PENDING_LINK_KEY = 'newmantle_pending_link';
const GUEST_ID_KEY = 'newmantle_guest_id';

async function attemptLinkWithBackoff(guestId: string): Promise<void> {
  const delays = [1000, 2000, 4000];
  for (let i = 0; i <= delays.length; i++) {
    try {
      await linkGuestStats(guestId);
      return;
    } catch {
      if (i === delays.length) return;
      await new Promise((resolve) => setTimeout(resolve, delays[i]));
    }
  }
}

export function useGuestLink() {
  useEffect(() => {
    const pendingLink = localStorage.getItem(PENDING_LINK_KEY);
    if (!pendingLink) return;

    const guestId = localStorage.getItem(GUEST_ID_KEY);
    localStorage.removeItem(PENDING_LINK_KEY);
    if (!guestId) return;

    attemptLinkWithBackoff(guestId).then(() => {
      localStorage.removeItem(GUEST_ID_KEY);
    });
  }, []);
}
