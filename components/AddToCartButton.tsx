'use client';

import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AddToCartButton({
  product,
  sticky = false,
}: {
  product: { id: string; name: string; price: number; image: string; stock?: number; isActive?: boolean };
  sticky?: boolean;
}) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const available = product.isActive !== false && (product.stock ?? 1) > 0;
  const maxQty = Math.max(1, product.stock ?? 99);

  return (
    <div
      className={
        sticky
          ? 'fixed left-1/2 z-[35] w-full max-w-[430px] -translate-x-1/2 border-t border-[#eadfce] bg-white/95 px-5 py-3 shadow-[0_-12px_28px_rgba(31,42,36,.1)] backdrop-blur bottom-[calc(73px+env(safe-area-inset-bottom))]'
          : 'mt-4'
      }
    >
      {sticky && (
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="line-clamp-1 text-sm font-black text-[#1f2a24]">{product.name}</p>
            <p className="mt-1 text-base font-black text-[#214b36]">{won(product.price * qty)}</p>
          </div>
          {done && (
            <span className="rounded-full bg-[#e5f0dc] px-3 py-1 text-[11px] font-black text-[#214b36]">
              담겼어요
            </span>
          )}
        </div>
      )}
      {!available && (
        <p className="mb-3 rounded-2xl bg-red-50 p-3 text-center text-sm font-black text-red-600">
          현재 품절되어 주문할 수 없어요
        </p>
      )}
      <div className="mb-3 flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-[#eadfce]">
        <span className="text-sm font-black text-[#214b36]">수량</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} className="h-9 w-9 rounded-full bg-[#f1ead9] font-black">-</button>
          <span className="w-8 text-center font-black">{qty}</span>
          <button type="button" onClick={() => setQty(Math.min(maxQty, qty + 1))} className="h-9 w-9 rounded-full bg-[#f1ead9] font-black">+</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { add(product, qty); setDone(true); window.setTimeout(() => setDone(false), 1400); }}
          disabled={!available}
          className="rounded-2xl bg-[#f1ead9] px-5 py-4 text-sm font-black text-[#214b36] active:scale-[.99] disabled:opacity-45"
        >
          {!available ? '품절' : done ? '담겼어요 ✓' : '장바구니'}
        </button>
        <button
          type="button"
          onClick={() => { add(product, qty); router.push('/cart'); }}
          disabled={!available}
          className="rounded-2xl bg-[#214b36] px-5 py-4 text-sm font-black text-white active:scale-[.99] disabled:opacity-45"
        >
          {!available ? '주문불가' : '바로구매'}
        </button>
      </div>
    </div>
  );
}
