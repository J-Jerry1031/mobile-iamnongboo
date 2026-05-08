'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';
import { PackageCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';

export default function CartPage() {
  const { items, inc, dec, remove, setQty } = useCart();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= 30000 ? 0 : 3000;
  const total = subtotal + deliveryFee;

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">CART</p>
        <h1 className="mt-2 text-2xl font-black">장바구니</h1>
        <p className="mt-2 text-[13px] text-white/75">
          30,000원 이상 구매 시 배송비가 무료입니다.
        </p>
      </div>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 rounded-3xl bg-white p-4 shadow-sm">
            <img src={item.image} alt={item.name} className="h-20 w-20 rounded-2xl object-cover" />
            <div className="flex-1">
              <p className="font-black">{item.name}</p>
              <p className="text-sm font-bold text-[#214b36]">{won(item.price)}</p>
              <p className="mt-1 text-[11px] font-bold text-[#668f6b]">신선보장 · 산지직송</p>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => dec(item.id)} className="h-8 w-8 rounded-full bg-[#f1ead9] font-black">-</button>
                <input value={item.quantity} onChange={(e) => setQty(item.id, Number(e.target.value || 1))} className="w-10 rounded-lg bg-[#fffaf0] text-center" />
                <button onClick={() => inc(item.id)} className="h-8 w-8 rounded-full bg-[#f1ead9] font-black">+</button>
                <button onClick={() => remove(item.id)} className="ml-auto rounded-full bg-[#fff1ef] p-2 text-red-500" aria-label={`${item.name} 삭제`}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="rounded-3xl bg-white p-8 text-center text-sm text-[#7a6b4d]">
            <ShoppingBag className="mx-auto text-[#668f6b]" size={42} />
            <p className="mt-4 font-black text-[#1f2a24]">장바구니가 비어 있어요.</p>
            <p className="mt-2 leading-6">오늘 들어온 신선한 상품을 둘러보세요.</p>
            <Link href="/products/market" className="mt-5 inline-flex rounded-full bg-[#214b36] px-5 py-3 font-black text-white">
              상품 보러가기
            </Link>
          </div>
        )}
      </div>
      <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
        <div className="space-y-3 text-sm font-bold text-[#5b5141]">
          <div className="flex justify-between"><span>상품금액</span><span>{won(subtotal)}</span></div>
          <div className="flex justify-between"><span>배송비</span><span>{deliveryFee ? won(deliveryFee) : '무료'}</span></div>
          <div className="flex items-center gap-2 rounded-2xl bg-[#fcfbf6] p-3 text-[12px] text-[#668f6b]">
            <Truck size={16} />
            {subtotal >= 30000 ? '무료배송이 적용됐어요.' : `무료배송까지 ${won(Math.max(0, 30000 - subtotal))} 남았어요.`}
          </div>
        </div>
        <div className="mt-5 flex justify-between border-t border-[#eadfce] pt-5 text-lg font-black text-[#1f2a24]"><span>총 결제금액</span><span>{won(total)}</span></div>
        <Link href={items.length ? '/checkout' : '/products/market'} className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#214b36] py-4 text-center font-black text-white">
          <PackageCheck size={19} /> {items.length ? '주문하기' : '상품 담으러 가기'}
        </Link>
      </div>
    </div>
  );
}
