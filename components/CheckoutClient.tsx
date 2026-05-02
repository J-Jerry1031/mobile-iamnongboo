'use client';

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';
import { useState } from 'react';

export function CheckoutClient() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [address, setAddress] = useState('매장 픽업');
  const [loading, setLoading] = useState(false);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function pay() {
    try {
      if (!items.length) return alert('장바구니가 비어 있어요.');
      if (!buyerName || !buyerPhone) return alert('이름과 연락처를 입력해줘.');
      setLoading(true);
      const tossOrderId = `IAMNONGBU-${Date.now()}`;
      const createRes = await fetch('/api/orders/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, buyerName, buyerPhone, address, tossOrderId }) });
      if (!createRes.ok) throw new Error((await createRes.json()).message || '주문 생성 실패');

      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      const payment = tossPayments.payment({ customerKey: 'ANONYMOUS' });
      clear();
      await payment.requestPayment({ method: 'CARD', amount: { currency: 'KRW', value: total }, orderId: tossOrderId, orderName: items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`, successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success`, failUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/fail`, customerName: buyerName, customerMobilePhone: buyerPhone.replaceAll('-', '') });
    } catch (error) {
      alert(error instanceof Error ? error.message : '결제 준비 중 문제가 생겼어요.');
      setLoading(false);
    }
  }

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">주문/결제</h1>
      <section className="mt-5 rounded-3xl bg-white p-5">
        <h2 className="font-black">주문자 정보</h2>
        <div className="mt-4 space-y-3">
          <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="이름" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="연락처 010-0000-0000" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="배송지 또는 픽업 요청사항" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
        </div>
      </section>
      <section className="mt-4 rounded-3xl bg-white p-5">
        <p className="font-black">주문상품</p>
        <div className="mt-3 space-y-2 text-sm">{items.map((item) => <div key={item.id} className="flex justify-between gap-3"><span>{item.name} × {item.quantity}</span><span>{won(item.price * item.quantity)}</span></div>)}</div>
        <div className="mt-5 flex justify-between border-t pt-4 text-lg font-black"><span>총액</span><span>{won(total)}</span></div>
      </section>
      <button disabled={loading} onClick={pay} className="mt-5 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white disabled:opacity-50">{loading ? '결제 준비 중...' : '토스페이먼츠 테스트 결제'}</button>
    </div>
  );
}
