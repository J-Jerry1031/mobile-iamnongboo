'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart-store';

const AUTH_STATE_KEY = 'iamnongbu-auth-state';

export function AuthCartReset({ isAuthenticated }: { isAuthenticated: boolean }) {
  const clear = useCart((state) => state.clear);

  useEffect(() => {
    queueMicrotask(() => {
      const previousState = window.localStorage.getItem(AUTH_STATE_KEY);

      if (isAuthenticated) {
        window.localStorage.setItem(AUTH_STATE_KEY, 'authenticated');
        return;
      }

      if (previousState === 'authenticated' || previousState === null) {
        clear();
      }

      window.localStorage.setItem(AUTH_STATE_KEY, 'anonymous-ready');
    });
  }, [clear, isAuthenticated]);

  return null;
}

export function markAnonymousCartState() {
  window.localStorage.setItem(AUTH_STATE_KEY, 'anonymous-ready');
}
