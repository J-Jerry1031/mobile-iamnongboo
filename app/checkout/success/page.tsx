import Link from 'next/link';
import { ClearCartOnSuccess } from '@/components/ClearCartOnSuccess';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { headers } from 'next/headers';
import { CheckCircle2, ChevronRight, Clock3, Home, MessageCircle, PackageCheck, ReceiptText, Store, Truck } from 'lucide-react';

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }> }) {
  const params = await searchParams;
  let message = '결제 정보가 없습니다.';
  let approved = false;
  let order = params.orderId
    ? await prisma.order.findUnique({ where: { tossOrderId: params.orderId }, include: { items: true } })
    : null;

  if (params.paymentKey && params.orderId && params.amount) {
    const headerList = await headers();
    const origin = process.env.NEXT_PUBLIC_BASE_URL || `${headerList.get('x-forwarded-proto') || 'http'}://${headerList.get('host')}`;
    const res = await fetch(`${origin}/api/toss/confirm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentKey: params.paymentKey, orderId: params.orderId, amount: Number(params.amount) }), cache: 'no-store' });
    const data = await res.json() as { message?: string; status?: string; approvedAt?: string };
    approved = res.ok;
    message = res.ok ? '주문과 결제가 정상적으로 완료됐어요.' : data.message || '결제 승인 중 문제가 생겼어요.';
    order = await prisma.order.findUnique({ where: { tossOrderId: params.orderId }, include: { items: true } });
  }

  const isPickup = order?.address?.includes('매장 픽업');
  const itemSummary = order?.items.length
    ? order.items.length === 1
      ? order.items[0].name
      : `${order.items[0].name} 외 ${order.items.length - 1}건`
    : '주문 상품';

  return <div className="px-5 pb-8 pt-8">
    {approved && <ClearCartOnSuccess />}
    <div className="rounded-[28px] bg-[#214b36] p-6 text-center text-white">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#e5f0dc] text-[#214b36]">
        <CheckCircle2 size={42} />
      </div>
      <p className="mt-5 text-[12px] font-bold text-[#f5d87a]">{approved ? 'ORDER COMPLETE' : 'PAYMENT CHECK'}</p>
      <h1 className="mt-2 text-2xl font-black">{approved ? '주문이 완료됐어요' : '결제 확인이 필요해요'}</h1>
      <p className="mt-3 text-sm leading-6 text-white/75">{message}</p>
    </div>

    {order && (
      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-[#7a6b4d]">주문번호</p>
            <p className="mt-1 font-black text-[#1f2a24]">{order.orderNo}</p>
          </div>
          <span className="rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">
            결제완료
          </span>
        </div>
        <div className="mt-5 rounded-2xl bg-[#fffaf0] p-4">
          <p className="line-clamp-1 font-black text-[#1f2a24]">{itemSummary}</p>
          <p className="mt-2 text-sm font-bold text-[#7a6b4d]">{order.items.reduce((sum, item) => sum + item.quantity, 0)}개 상품 · {won(order.totalAmount)}</p>
        </div>
        <div className="mt-4 space-y-3 text-sm text-[#5b5141]">
          <p className="flex items-start gap-3">
            {isPickup ? <Store className="mt-0.5 text-[#668f6b]" size={18} /> : <Truck className="mt-0.5 text-[#668f6b]" size={18} />}
            <span>{isPickup ? '상품 준비가 끝나면 픽업 안내를 드릴게요.' : '결제 확인 후 신선도 검수와 포장을 진행합니다.'}</span>
          </p>
          <p className="flex items-start gap-3">
            <Clock3 className="mt-0.5 text-[#668f6b]" size={18} />
            <span>입고 상태에 따라 출고 일정이 달라질 수 있으며, 변동 시 연락드립니다.</span>
          </p>
        </div>
      </section>
    )}

    <section className="mt-4 rounded-3xl bg-[#fcfbf6] p-5 ring-1 ring-[#eadfce]">
      <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
        <ReceiptText size={19} className="text-[#668f6b]" /> 다음 안내
      </h2>
      <div className="mt-4 grid grid-cols-[24px_1fr] gap-x-3 gap-y-4 text-sm text-[#5b5141]">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#214b36] text-xs font-black text-white">1</span>
        <p>주문 확인 후 상품 상태를 검수합니다.</p>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#214b36] text-xs font-black text-white">2</span>
        <p>픽업 또는 배송 준비가 완료되면 연락처로 안내드립니다.</p>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#214b36] text-xs font-black text-white">3</span>
        <p>상품 수령 후 문제가 있으면 당일 사진과 함께 문의해주세요.</p>
      </div>
    </section>

    <div className="mt-5 grid grid-cols-2 gap-2">
      <Link href="/orders" className="flex items-center justify-center gap-2 rounded-2xl bg-[#214b36] px-4 py-4 font-black text-white"><PackageCheck size={18} /> 주문내역</Link>
      <Link href="/" className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 font-black text-[#214b36]"><Home size={18} /> 홈으로</Link>
    </div>

    <Link href="/inquiries" className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-4 text-sm font-black text-[#214b36]">
      <MessageCircle size={17} /> 문의 남기기 <ChevronRight size={16} />
    </Link>
  </div>;
}
