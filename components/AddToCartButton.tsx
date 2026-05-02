'use client';

import { useCart } from '@/lib/cart-store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AddToCartButton({ product }: { product: { id: string; name: string; price: number; image: string } }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white p-3">
        <span className="text-sm font-black text-[#214b36]">수량</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="h-9 w-9 rounded-full bg-[#f1ead9] font-black">-</button>
          <span className="w-8 text-center font-black">{qty}</span>
          <button type="button" onClick={() => setQty(qty + 1)} className="h-9 w-9 rounded-full bg-[#f1ead9] font-black">+</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { add(product, qty); setDone(true); }}
          className="rounded-2xl bg-[#f1ead9] px-5 py-4 text-sm font-black text-[#214b36] active:scale-[.99]"
        >
          {done ? '담겼어요 ✓' : '장바구니'}
        </button>
        <button
          type="button"
          onClick={() => { add(product, qty); router.push('/cart'); }}
          className="rounded-2xl bg-[#214b36] px-5 py-4 text-sm font-black text-white active:scale-[.99]"
        >
          바로구매
        </button>
      </div>
    </div>
  );
}
