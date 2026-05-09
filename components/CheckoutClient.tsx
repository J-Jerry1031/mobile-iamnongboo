'use client';

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';
import { CheckCircle2, CreditCard, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';

export function CheckoutClient() {
  const items = useCart((s) => s.items);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryMethod === 'pickup' || subtotal === 0 || subtotal >= 30000 ? 0 : 3000;
  const total = subtotal + deliveryFee;
  const normalizedPhone = buyerPhone.replaceAll('-', '').replaceAll(' ', '');
  const canPay = useMemo(() => {
    if (!items.length) return false;
    if (!buyerName.trim()) return false;
    if (!/^01\d{8,9}$/.test(normalizedPhone)) return false;
    if (deliveryMethod === 'delivery' && !address.trim()) return false;
    return agree;
  }, [address, agree, buyerName, deliveryMethod, items.length, normalizedPhone]);

  async function pay() {
    try {
      if (!items.length) return alert('장바구니가 비어 있어요.');
      if (!buyerName.trim()) return alert('이름을 입력해주세요.');
      if (!/^01\d{8,9}$/.test(normalizedPhone)) return alert('연락처를 정확히 입력해주세요.');
      if (deliveryMethod === 'delivery' && !address.trim()) return alert('배송지를 입력해주세요.');
      if (!agree) return alert('주문 내용을 확인하고 동의해주세요.');
      setLoading(true);
      const tossOrderId = `IAMNONGBU-${Date.now()}`;
      const createRes = await fetch('/api/orders/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items, buyerName, buyerPhone: normalizedPhone, address: deliveryMethod === 'pickup' ? '매장 픽업' : address, deliveryMethod, tossOrderId }) });
      if (!createRes.ok) throw new Error((await createRes.json()).message || '주문 생성 실패');
      const order = await createRes.json() as { totalAmount: number; orderNo: string };

      if (!process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY) {
        throw new Error('결제 키가 설정되지 않았어요. 관리자에게 문의해주세요.');
      }

      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      const payment = tossPayments.payment({ customerKey: 'ANONYMOUS' });
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      await payment.requestPayment({ method: 'CARD', amount: { currency: 'KRW', value: order.totalAmount }, orderId: tossOrderId, orderName: items.length === 1 ? items[0].name : `${items[0].name} 외 ${items.length - 1}건`, successUrl: `${baseUrl}/checkout/success`, failUrl: `${baseUrl}/checkout/fail`, customerName: buyerName, customerMobilePhone: normalizedPhone });
    } catch (error) {
  console.error('TOSS_PAYMENT_ERROR:', error);

  if (error instanceof Error) {
    console.error('TOSS_PAYMENT_ERROR_MESSAGE:', error.message);
    console.error('TOSS_PAYMENT_ERROR_STACK:', error.stack);
  }

  alert(error instanceof Error ? error.message : '결제 준비 중 문제가 생겼어요.');
  setLoading(false);
}
  }

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">CHECKOUT</p>
        <h1 className="mt-2 text-2xl font-black">주문/결제</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">
          주문 정보를 확인한 뒤 안전하게 결제를 진행해주세요.
        </p>
      </div>

      <section className="mt-5 rounded-3xl bg-white p-5">
        <h2 className="flex items-center gap-2 font-black">
          <ShieldCheck size={19} className="text-[#668f6b]" /> 주문자 정보
        </h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-2 block text-xs font-black text-[#7a6b4d]">이름</span>
            <input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="홍길동" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-black text-[#7a6b4d]">연락처</span>
            <input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="010-0000-0000" inputMode="tel" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
          </label>
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-5">
        <h2 className="flex items-center gap-2 font-black">
          <Truck size={19} className="text-[#668f6b]" /> 수령 방법
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: '매장 픽업', value: 'pickup' as const },
            { label: '배송 받기', value: 'delivery' as const },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDeliveryMethod(option.value)}
              className={`rounded-2xl px-4 py-3 text-sm font-black ${
                deliveryMethod === option.value
                  ? 'bg-[#214b36] text-white'
                  : 'bg-[#fffaf0] text-[#214b36]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="mb-2 block text-xs font-black text-[#7a6b4d]">
            {deliveryMethod === 'pickup' ? '픽업 요청사항' : '배송지'}
          </span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={deliveryMethod === 'pickup' ? '예: 오후 6시 픽업 예정' : '주소와 공동현관 정보를 입력해주세요'} className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
        </label>
        <p className="mt-3 flex items-center gap-2 text-[12px] font-bold text-[#668f6b]">
          <MapPin size={15} /> 매장 픽업은 배송비 없이 준비됩니다.
        </p>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-5">
        <p className="flex items-center gap-2 font-black">
          <PackageCheck size={19} className="text-[#668f6b]" /> 주문상품
        </p>
        <div className="mt-4 space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-2xl bg-[#fffaf0] p-3">
              <img src={item.image} alt={item.name} className="h-14 w-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-black">{item.name}</p>
                <p className="mt-1 text-xs text-[#7a6b4d]">수량 {item.quantity}개</p>
              </div>
              <span className="font-black text-[#214b36]">{won(item.price * item.quantity)}</span>
            </div>
          ))}
          {!items.length && (
            <p className="rounded-2xl bg-[#fffaf0] p-4 text-[#7a6b4d]">
              장바구니에 담긴 상품이 없어요.
            </p>
          )}
        </div>
        <div className="mt-5 space-y-3 border-t border-[#eadfce] pt-4 text-sm font-bold text-[#5b5141]">
          <div className="flex justify-between"><span>상품금액</span><span>{won(subtotal)}</span></div>
          <div className="flex justify-between"><span>배송비</span><span>{deliveryFee ? won(deliveryFee) : '무료'}</span></div>
        </div>
        <div className="mt-4 flex justify-between border-t border-[#eadfce] pt-4 text-lg font-black"><span>총 결제금액</span><span>{won(total)}</span></div>
      </section>

      <label className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 text-sm font-bold text-[#5b5141]">
        <input checked={agree} onChange={(e) => setAgree(e.target.checked)} type="checkbox" className="mt-1 h-4 w-4 accent-[#214b36]" />
        <span>주문 상품, 수령 방법, 결제 금액을 확인했으며 개인정보 수집 및 결제 진행에 동의합니다.</span>
      </label>

      <button disabled={loading || !canPay} onClick={pay} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#214b36] py-4 font-black text-white disabled:opacity-45">
        <CreditCard size={19} /> {loading ? '결제 준비 중...' : `${won(total)} 결제하기`}
      </button>
      {canPay && (
        <p className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-[#668f6b]">
          <CheckCircle2 size={14} /> 안전 결제 준비가 완료됐어요.
        </p>
      )}
    </div>
  );
}
