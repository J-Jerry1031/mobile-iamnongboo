'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart-store';

export function HeaderCartButton() {
  const items = useCart((state) => state.items);
  const [mounted, setMounted] = useState(false);
  const count = mounted
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  return (
    <Link href="/cart" className="header-icon-button relative" aria-label={`장바구니${count ? ` ${count}개` : ''}`}>
      <ShoppingBag size={20} strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e53935] px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
