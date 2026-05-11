import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { writePrivacyAccessLog } from '@/lib/privacy-audit';
import { OrderActionButtons } from '@/components/OrderActionButtons';
import { orderStatusLabel, reviewableStatuses } from '@/lib/order-status';
import {
  ChevronLeft,
  Clock3,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Star,
  Store,
  Truck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  if (!user) redirect(`/login?next=${encodeURIComponent(`/orders/${id}`)}&reason=protected`);
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();
  if (user.role !== 'ADMIN' && order.userId !== user.id) redirect('/orders');
  if (user.role === 'ADMIN') {
    await writePrivacyAccessLog({
      adminId: user.id,
      action: 'ORDER_DETAIL_VIEW',
      targetType: 'ORDER',
      targetId: order.id,
      summary: `${order.orderNo} 주문 상세 조회`,
    });
  }

  const productIds = order.items.map((item) => item.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, image: true } });
  const productImageMap = new Map(products.map((product) => [product.id, product.image]));
  const isPickup = order.address?.includes('매장 픽업');
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = Math.max(0, order.totalAmount - subtotal);
  const canReview = reviewableStatuses.includes(order.status);

  return (
    <div className="px-5 pb-8 pt-3">
      <Link href="/orders" className="mb-3 inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
        <ChevronLeft size={18} /> 주문내역
      </Link>

      <section className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">ORDER DETAIL</p>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">주문 상세</h1>
            <p className="mt-2 text-sm font-bold text-white/75">{order.orderNo}</p>
          </div>
          <span className="rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">
            {orderStatusLabel[order.status]}
          </span>
        </div>
      </section>

      <section className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <PackageCheck size={19} className="text-[#668f6b]" /> 주문 상품
        </h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-2xl bg-[#fffaf0] p-3">
              {productImageMap.get(item.productId) ? (
                <img src={productImageMap.get(item.productId)} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-xl bg-[#e5f0dc] text-[#214b36]">
                  <PackageCheck size={22} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 font-black text-[#1f2a24]">{item.name}</p>
                <p className="mt-1 text-xs font-bold text-[#7a6b4d]">수량 {item.quantity}개</p>
                <p className="mt-2 font-black text-[#214b36]">{won(item.price * item.quantity)}</p>
              </div>
              {canReview ? (
                <Link href={`/reviews?productId=${item.productId}&orderId=${order.id}`} className="h-fit rounded-full bg-white px-3 py-2 text-xs font-black text-[#214b36]">
                  후기
                </Link>
              ) : (
                <span className="h-fit rounded-full bg-white px-3 py-2 text-xs font-black text-[#b2a282]">
                  결제 후
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          <ReceiptText size={19} className="text-[#668f6b]" /> 결제 정보
        </h2>
        <div className="mt-4 space-y-3 text-sm font-bold text-[#5b5141]">
          <div className="flex justify-between"><span>상품금액</span><span>{won(subtotal)}</span></div>
          <div className="flex justify-between"><span>배송비</span><span>{deliveryFee ? won(deliveryFee) : '무료'}</span></div>
          {order.discountAmount > 0 && <div className="flex justify-between text-[#214b36]"><span>쿠폰할인</span><span>-{won(order.discountAmount)}</span></div>}
          <div className="flex justify-between border-t border-[#eadfce] pt-4 text-lg font-black text-[#1f2a24]">
            <span>총 결제금액</span><span className="text-[#214b36]">{won(order.totalAmount)}</span>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-[#fcfbf6] p-5 ring-1 ring-[#eadfce]">
        <h2 className="flex items-center gap-2 font-black text-[#1f2a24]">
          {isPickup ? <Store size={19} className="text-[#668f6b]" /> : <Truck size={19} className="text-[#668f6b]" />}
          {isPickup ? '픽업 안내' : '배송 안내'}
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[#5b5141]">
          <p className="flex items-start gap-3">
            <Clock3 className="mt-0.5 text-[#668f6b]" size={18} />
            <span>{isPickup ? '상품 준비가 완료되면 픽업 가능 시간을 안내드립니다.' : '결제 확인 후 검수와 포장을 거쳐 순차 출고됩니다.'}</span>
          </p>
          <p className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 text-[#668f6b]" size={18} />
            <span>상품 이상은 수령 당일 사진과 함께 문의해주세요.</span>
          </p>
          {order.address && <p className="rounded-2xl bg-white p-3 font-bold text-[#214b36]">{order.address}</p>}
          {order.trackingNumber && (
            <div className="rounded-2xl bg-white p-3 font-bold text-[#214b36]">
              <p>{order.carrier} · {order.trackingNumber}</p>
              {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-full bg-[#214b36] px-3 py-2 text-xs text-white">배송조회</a>}
            </div>
          )}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/inquiries/board" className="flex items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-black text-[#214b36]">
          <MessageCircle size={17} /> 문의하기
        </Link>
        {canReview && order.items[0] ? (
          <Link href={`/reviews?productId=${order.items[0].productId}&orderId=${order.id}`} className="flex items-center justify-center gap-2 rounded-2xl bg-[#214b36] py-4 text-sm font-black text-white">
            <Star size={17} /> 후기쓰기
          </Link>
        ) : (
          <span className="flex items-center justify-center gap-2 rounded-2xl bg-[#f1ead9] py-4 text-sm font-black text-[#b2a282]">
            <Star size={17} /> 결제 후 후기
          </span>
        )}
      </div>

      <OrderActionButtons orderId={order.id} status={order.status} />
    </div>
  );
}
