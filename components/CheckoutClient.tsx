'use client';

import { loadTossPayments } from '@tosspayments/tosspayments-sdk';
import { useCart } from '@/lib/cart-store';
import { won } from '@/lib/format';
import { formatPhone, normalizePhone } from '@/lib/phone';
import { KakaoPostcodeButton } from '@/components/KakaoPostcodeButton';
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Home,
  MapPin,
  PackageCheck,
  PlusCircle,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type SavedAddress = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  zonecode: string | null;
  address: string;
  detail: string | null;
  isDefault: boolean;
};

export function CheckoutClient() {
  const items = useCart((s) => s.items);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [pickupMemo, setPickupMemo] = useState('');
  const [zonecode, setZonecode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [addressLabel, setAddressLabel] = useState('우리집');
  const [saveAddress, setSaveAddress] = useState(true);
  const [canUseAddressBook, setCanUseAddressBook] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryMethod === 'pickup' || subtotal === 0 || subtotal >= 30000 ? 0 : 3000;
  const total = subtotal + deliveryFee;
  const normalizedPhone = normalizePhone(buyerPhone);
  const fullAddress = useMemo(
    () => [zonecode ? `(${zonecode})` : '', address, addressDetail].filter(Boolean).join(' '),
    [address, addressDetail, zonecode],
  );
  const firstMissing = useMemo(() => {
    if (!items.length) return '장바구니에 상품을 담아주세요.';
    if (!buyerName.trim()) return '주문자 이름을 입력해주세요.';
    if (!/^01\d{8,9}$/.test(normalizedPhone)) return '연락처를 정확히 입력해주세요.';
    if (deliveryMethod === 'delivery' && !address.trim()) return '배송지를 검색해주세요.';
    if (!agree) return '주문 내용 확인 동의가 필요해요.';
    return '안전 결제 준비가 완료됐어요.';
  }, [address, agree, buyerName, deliveryMethod, items.length, normalizedPhone]);
  const canPay = useMemo(() => {
    if (!items.length) return false;
    if (!buyerName.trim()) return false;
    if (!/^01\d{8,9}$/.test(normalizedPhone)) return false;
    if (deliveryMethod === 'delivery' && !address.trim()) return false;
    return agree;
  }, [address, agree, buyerName, deliveryMethod, items.length, normalizedPhone]);

  useEffect(() => {
    let ignore = false;

    async function loadAddresses() {
      const res = await fetch('/api/addresses', { cache: 'no-store' });
      if (ignore) return;
      if (res.status === 401) {
        setCanUseAddressBook(false);
        return;
      }
      if (!res.ok) return;

      const data = (await res.json()) as { addresses: SavedAddress[] };
      setCanUseAddressBook(true);
      setSavedAddresses(data.addresses);

      const first = data.addresses.find((item) => item.isDefault) || data.addresses[0];
      if (first) selectAddress(first);
    }

    loadAddresses();
    return () => {
      ignore = true;
    };
  }, []);

  function selectAddress(nextAddress: SavedAddress) {
    setSelectedAddressId(nextAddress.id);
    setBuyerName(nextAddress.recipient);
    setBuyerPhone(formatPhone(nextAddress.phone));
    setZonecode(nextAddress.zonecode || '');
    setAddress(nextAddress.address);
    setAddressDetail(nextAddress.detail || '');
    setDeliveryMethod('delivery');
    setSaveAddress(false);
  }

  function clearForNewAddress() {
    setSelectedAddressId('');
    setZonecode('');
    setAddress('');
    setAddressDetail('');
    setSaveAddress(canUseAddressBook);
  }

  async function saveCurrentAddress() {
    if (!canUseAddressBook || deliveryMethod !== 'delivery' || !saveAddress || selectedAddressId || !address.trim()) return;

    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: addressLabel,
        recipient: buyerName,
        phone: normalizedPhone,
        zonecode,
        address,
        detail: addressDetail,
        isDefault: savedAddresses.length === 0,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: '배송지 저장 실패' }));
      throw new Error(data.message || '배송지를 저장하지 못했어요.');
    }
  }

  async function pay() {
    try {
      if (!items.length) return alert('장바구니가 비어 있어요.');
      if (!buyerName.trim()) return alert('이름을 입력해주세요.');
      if (!/^01\d{8,9}$/.test(normalizedPhone)) return alert('연락처를 정확히 입력해주세요.');
      if (deliveryMethod === 'delivery' && !address.trim()) return alert('배송지를 검색해주세요.');
      if (!agree) return alert('주문 내용을 확인하고 동의해주세요.');
      setLoading(true);
      await saveCurrentAddress();
      const tossOrderId = `IAMNONGBU-${Date.now()}`;
      const createRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          buyerName,
          buyerPhone: normalizedPhone,
          address: deliveryMethod === 'pickup' ? pickupMemo : fullAddress,
          deliveryMethod,
          tossOrderId,
        }),
      });
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
    <div className="px-5 pb-40 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">CHECKOUT</p>
        <h1 className="mt-2 text-2xl font-black">주문/결제</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">
          주문 정보를 확인한 뒤 안전하게 결제를 진행해주세요.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {['정보입력', '수령방법', '결제확인'].map((step, index) => (
          <div key={step} className={`rounded-2xl p-3 text-center text-xs font-black ${index === 2 && canPay ? 'bg-[#214b36] text-white' : 'bg-white text-[#214b36]'}`}>
            <span className="mx-auto mb-2 grid h-6 w-6 place-items-center rounded-full bg-[#e5f0dc] text-[11px] text-[#214b36]">{index + 1}</span>
            {step}
          </div>
        ))}
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
            <input value={buyerPhone} onChange={(e) => setBuyerPhone(formatPhone(e.target.value))} maxLength={13} placeholder="010-0000-0000" inputMode="tel" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
          </label>
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-5">
        <h2 className="flex items-center gap-2 font-black">
          <Truck size={19} className="text-[#668f6b]" /> 수령 방법
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: '매장 픽업', value: 'pickup' as const, icon: Store },
            { label: '배송 받기', value: 'delivery' as const, icon: Truck },
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
              <option.icon className="mx-auto mb-2" size={18} />
              {option.label}
            </button>
          ))}
        </div>

        {deliveryMethod === 'delivery' ? (
          <div className="mt-4 space-y-4">
            {canUseAddressBook && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#7a6b4d]">저장된 배송지</span>
                  <button type="button" onClick={clearForNewAddress} className="inline-flex items-center gap-1 text-xs font-black text-[#214b36]">
                    <PlusCircle size={14} /> 새 배송지
                  </button>
                </div>
                {savedAddresses.length > 0 ? (
                  <div className="space-y-2">
                    {savedAddresses.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectAddress(item)}
                        className={`w-full rounded-2xl p-4 text-left active:scale-[.99] ${
                          selectedAddressId === item.id
                            ? 'bg-[#e5f0dc] ring-2 ring-[#668f6b]'
                            : 'bg-[#fffaf0]'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm font-black text-[#1f2a24]">
                          <Home size={16} className="text-[#668f6b]" />
                          {item.label}
                          {item.isDefault && <span className="rounded-full bg-white px-2 py-1 text-[10px] text-[#214b36]">기본</span>}
                        </span>
                        <span className="mt-2 block text-xs font-bold leading-5 text-[#7a6b4d]">
                          {item.recipient} · {formatPhone(item.phone)}<br />
                          {item.zonecode ? `(${item.zonecode}) ` : ''}{item.address} {item.detail || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-[#fffaf0] p-4 text-xs font-bold text-[#7a6b4d]">
                    저장된 배송지가 없어요. 주소를 검색해 첫 배송지를 저장해보세요.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={zonecode} readOnly placeholder="우편번호" className="min-w-0 flex-1 rounded-2xl bg-[#fffaf0] p-4 outline-none" />
                <KakaoPostcodeButton
                  onSelect={(data) => {
                    setSelectedAddressId('');
                    setZonecode(data.zonecode);
                    setAddress(data.address);
                    setSaveAddress(canUseAddressBook);
                  }}
                  className="shrink-0"
                />
              </div>
              <input value={address} readOnly placeholder="주소 검색을 눌러 주소를 입력해주세요" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none" />
              <input value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="상세주소와 공동현관 정보를 입력해주세요" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
              {canUseAddressBook && !selectedAddressId && (
                <div className="rounded-2xl bg-[#fcfbf6] p-4">
                  <label className="flex items-center gap-3 text-sm font-black text-[#214b36]">
                    <input checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} type="checkbox" className="h-4 w-4 accent-[#214b36]" />
                    이 배송지를 저장
                  </label>
                  {saveAddress && (
                    <input value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} placeholder="배송지 이름 예: 우리집" className="mt-3 w-full rounded-2xl bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-[#668f6b]" />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-black text-[#7a6b4d]">픽업 요청사항</span>
            <input value={pickupMemo} onChange={(e) => setPickupMemo(e.target.value)} placeholder="예: 오후 6시 픽업 예정" className="w-full rounded-2xl bg-[#fffaf0] p-4 outline-none focus:ring-2 focus:ring-[#668f6b]" />
          </label>
        )}

        <p className="mt-3 flex items-center gap-2 text-[12px] font-bold text-[#668f6b]">
          <MapPin size={15} /> {deliveryMethod === 'pickup' ? '매장 픽업은 배송비 없이 준비됩니다.' : '30,000원 이상 주문 시 배송비가 무료입니다.'}
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
            <div className="rounded-2xl bg-[#fffaf0] p-5 text-center text-[#7a6b4d]">
              <ShoppingBag className="mx-auto text-[#668f6b]" size={34} />
              <p className="mt-3 font-black text-[#1f2a24]">장바구니에 담긴 상품이 없어요.</p>
              <Link href="/products/market" className="mt-4 inline-flex rounded-full bg-[#214b36] px-4 py-3 text-sm font-black text-white">
                상품 보러가기
              </Link>
            </div>
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

      <div className={`mt-4 flex items-center gap-2 rounded-2xl p-4 text-xs font-bold ${canPay ? 'bg-[#e5f0dc] text-[#214b36]' : 'bg-white text-[#7a6b4d]'}`}>
        <CheckCircle2 size={15} className={canPay ? 'text-[#214b36]' : 'text-[#b2a282]'} />
        {firstMissing}
      </div>

      <div className="fixed bottom-[calc(73px+env(safe-area-inset-bottom))] left-1/2 z-[35] w-full max-w-[430px] -translate-x-1/2 border-t border-[#eadfce] bg-white/95 px-5 py-3 shadow-[0_-12px_28px_rgba(31,42,36,.1)] backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-[#7a6b4d]">결제 예정금액</span>
          <span className="text-xl font-black text-[#214b36]">{won(total)}</span>
        </div>
        <button disabled={loading || !canPay} onClick={pay} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#214b36] py-4 font-black text-white disabled:opacity-45 active:scale-[.99]">
          <CreditCard size={19} /> {loading ? '결제 준비 중...' : '결제하기'} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
