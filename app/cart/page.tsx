'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';

export default function CartPage() {
  const { items, inc, dec, remove, setQty } = useCart();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">장바구니</h1>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-3xl bg-white p-4 shadow-sm">
            <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" />
            <div className="flex-1">
              <p className="font-black">{item.name}</p>
              <p className="text-sm font-bold text-[#214b36]">{won(item.price)}</p>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => dec(item.id)} className="rounded-full bg-[#f1ead9] px-3 py-1">-</button>
                <input value={item.quantity} onChange={(e) => setQty(item.id, Number(e.target.value || 1))} className="w-10 rounded-lg bg-[#fffaf0] text-center" />
                <button onClick={() => inc(item.id)} className="rounded-full bg-[#f1ead9] px-3 py-1">+</button>
                <button onClick={() => remove(item.id)} className="ml-auto text-xs text-red-500">삭제</button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <p className="rounded-3xl bg-white p-5 text-sm text-[#7a6b4d]">장바구니가 비어 있어요.</p>}
      </div>
      <div className="mt-6 rounded-3xl bg-[#214b36] p-5 text-white">
        <div className="flex justify-between text-lg font-black"><span>총 결제금액</span><span>{won(total)}</span></div>
        <Link href="/checkout" className="mt-4 block rounded-2xl bg-[#f5d87a] py-4 text-center font-black text-[#214b36]">주문하기</Link>
      </div>
    </div>
  );
}
