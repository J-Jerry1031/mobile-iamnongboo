'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';
import { BadgeCheck, Gift, PackageCheck, ShieldCheck, ShoppingBag, Trash2, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

type RecommendedProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
  badge: string | null;
  stock: number;
};

export default function CartPage() {
  const { items, add, inc, dec, remove, setQty } = useCart();
  const [recommended, setRecommended] = useState<RecommendedProduct[]>([]);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= 30000 ? 0 : 3000;
  const total = subtotal + deliveryFee;
  const freeDeliveryTarget = 30000;
  const freeDeliveryRemain = Math.max(0, freeDeliveryTarget - subtotal);
  const freeDeliveryProgress = Math.min(100, Math.round((subtotal / freeDeliveryTarget) * 100));

  useEffect(() => {
    fetch('/api/products/recommendations')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setRecommended((data?.products || []).filter((product: RecommendedProduct) => !items.some((item) => item.id === product.id)).slice(0, 4)))
      .catch(() => setRecommended([]));
  }, [items]);

  return (
    <div className="px-5 pb-8 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">CART</p>
        <h1 className="mt-2 text-2xl font-black">장바구니</h1>
        <p className="mt-2 text-[13px] text-white/75">
          30,000원 이상 구매 시 배송비가 무료입니다.
        </p>
      </div>

      {items.length > 0 && (
        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-black text-[#1f2a24]">
                {freeDeliveryRemain === 0 ? '무료배송이 적용됐어요' : `${won(freeDeliveryRemain)} 더 담으면 무료배송`}
              </p>
              <p className="mt-1 text-xs font-bold text-[#7a6b4d]">상품금액 기준 30,000원 이상</p>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#e5f0dc] text-[#214b36]">
              <Truck size={20} />
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f1ead9]">
            <div className="h-full rounded-full bg-[#668f6b]" style={{ width: `${freeDeliveryProgress}%` }} />
          </div>
        </section>
      )}

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
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#fcfbf6] px-3 py-2 text-xs font-bold text-[#7a6b4d]">
                <span>소계</span>
                <span className="text-[#214b36]">{won(item.price * item.quantity)}</span>
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

      {items.length > 0 && (
        <section className="mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: ShieldCheck, label: '신선보장' },
            { icon: BadgeCheck, label: '검수포장' },
            { icon: Gift, label: '산지직송' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-[#fcfbf6] p-3 text-center text-xs font-black text-[#214b36] ring-1 ring-[#eadfce]">
              <item.icon className="mx-auto mb-2 text-[#668f6b]" size={18} />
              {item.label}
            </div>
          ))}
        </section>
      )}

      {items.length > 0 && recommended.length > 0 && (
        <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-[#1f2a24]">함께 담으면 좋아요</h2>
            <Link href="/products/market" className="text-xs font-black text-[#214b36]">더보기</Link>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {recommended.map((product) => (
              <div key={product.id} className="w-[132px] shrink-0 rounded-2xl bg-[#fffaf0] p-3">
                <Link href={`/products/${product.id}`}>
                  <img src={product.image} alt={product.name} className="h-20 w-full rounded-xl object-cover" />
                  <p className="mt-2 line-clamp-2 min-h-[34px] text-xs font-black leading-[17px] text-[#1f2a24]">{product.name}</p>
                  <p className="mt-1 text-sm font-black text-[#214b36]">{won(product.price)}</p>
                </Link>
                <button onClick={() => add({ id: product.id, name: product.name, price: product.price, image: product.image })} className="mt-2 w-full rounded-xl bg-[#214b36] py-2 text-xs font-black text-white">
                  담기
                </button>
              </div>
            ))}
          </div>
          {freeDeliveryRemain > 0 && (
            <p className="mt-3 rounded-2xl bg-[#e5f0dc] p-3 text-xs font-black text-[#214b36]">
              추천 상품을 담으면 무료배송까지 더 가까워져요.
            </p>
          )}
        </section>
      )}

      <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
        {items.length > 0 ? (
          <>
            <div className="space-y-3 text-sm font-bold text-[#5b5141]">
              <div className="flex justify-between"><span>상품금액</span><span>{won(subtotal)}</span></div>
              <div className="flex justify-between"><span>배송비</span><span>{deliveryFee ? won(deliveryFee) : '무료'}</span></div>
              <div className="flex items-center gap-2 rounded-2xl bg-[#fcfbf6] p-3 text-[12px] text-[#668f6b]">
                <Truck size={16} />
                {subtotal >= 30000 ? '무료배송이 적용됐어요.' : `무료배송까지 ${won(Math.max(0, 30000 - subtotal))} 남았어요.`}
              </div>
            </div>
            <div className="mt-5 flex justify-between border-t border-[#eadfce] pt-5 text-lg font-black text-[#1f2a24]"><span>총 결제금액</span><span>{won(total)}</span></div>
          </>
        ) : (
          <p className="text-center text-sm font-bold leading-6 text-[#7a6b4d]">
            마음에 드는 상품을 담으면 결제금액과 배송비가 여기에 표시돼요.
          </p>
        )}
        <Link href={items.length ? '/checkout' : '/products/market'} className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#214b36] py-4 text-center font-black text-white">
          <PackageCheck size={19} /> {items.length ? '주문하기' : '상품 담으러 가기'}
        </Link>
      </div>
    </div>
  );
}
