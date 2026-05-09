'use client';

import { useCart } from '@/lib/cart-store';
import { useEffect } from 'react';

export function ClearCartOnSuccess() {
  const clear = useCart((s) => s.clear);

  useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
