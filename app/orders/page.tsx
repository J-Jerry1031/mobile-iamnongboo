import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { OrderActionButtons } from '@/components/OrderActionButtons';
import Link from 'next/link';
import { ChevronRight, MessageCircle, PackageCheck, ShoppingBag, Star } from 'lucide-react';
import { orderStatusLabel, reviewableStatuses } from '@/lib/order-status';

export const dynamic = 'force-dynamic';

const orderTabs = [
  { label: '전체', value: '', statuses: [] },
  { label: '결제완료', value: 'paid', statuses: ['PAID', 'PREPARING'] },
  { label: '배송/픽업', value: 'shipping', statuses: ['READY_FOR_PICKUP', 'SHIPPING'] },
  { label: '완료', value: 'done', statuses: ['COMPLETED'] },
  { label: '취소/반품', value: 'request', statuses: ['CANCEL_REQUESTED', 'CANCELED', 'RETURN_REQUESTED', 'RETURNED'] },
] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/orders&reason=protected');
  const params = await searchParams;
  const activeTab = orderTabs.find((tab) => tab.value === params.tab) || orderTabs[0];
  const statusFilter = activeTab.statuses.length ? { status: { in: [...activeTab.statuses] } } : {};
  const ownerFilter = user.role === 'ADMIN' ? {} : { userId: user.id };
  const [orders, statusCounts] = await Promise.all([
    prisma.order.findMany({ where: { ...ownerFilter, ...statusFilter }, orderBy: { createdAt: 'desc' }, include: { items: true } }),
    Promise.all(orderTabs.map((tab) => prisma.order.count({
      where: {
        ...ownerFilter,
        ...(tab.statuses.length ? { status: { in: [...tab.statuses] } } : {}),
      },
    }))),
  ]);
  const productIds = [...new Set(orders.flatMap((order) => order.items.map((item) => item.productId)))];
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, image: true } });
  const productImageMap = new Map(products.map((product) => [product.id, product.image]));
  return <div className="px-5 pt-5">
    <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
      <p className="text-[12px] font-bold text-[#f5d87a]">ORDERS</p>
      <h1 className="mt-2 text-2xl font-black">주문내역</h1>
      <p className="mt-2 text-[13px] text-white/75">결제 상태와 주문 상품을 확인할 수 있어요.</p>
    </div>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {orderTabs.map((tab, index) => {
        const active = tab.value === activeTab.value;
        const href = tab.value ? `/orders?tab=${tab.value}` : '/orders';
        return (
          <Link key={tab.value || 'all'} href={href} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ${active ? 'bg-[#214b36] text-white' : 'bg-white text-[#214b36] ring-1 ring-[#f1ead9]'}`}>
            {tab.label} {statusCounts[index] > 0 ? statusCounts[index] : ''}
          </Link>
        );
      })}
    </div>

    <div className="mt-4 rounded-3xl bg-[#fcfbf6] p-4 text-xs font-bold leading-5 text-[#7a6b4d] ring-1 ring-[#eadfce]">
      배송 상품은 출고 후 운송장 정보가 등록되며, 매장 픽업은 준비 완료 후 연락처로 안내드려요.
    </div>

    <div className="mt-5 space-y-4">{orders.map((order) => {
      const firstItem = order.items[0];
      const firstImage = firstItem ? productImageMap.get(firstItem.productId) : null;
      const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
      const canReview = reviewableStatuses.includes(order.status);

      return <div key={order.id} className="rounded-3xl bg-white p-5 text-sm shadow-sm">
        <div className="flex justify-between gap-3">
          <div>
            <p className="font-black">{order.orderNo}</p>
            <p className="mt-1 text-xs text-[#7a6b4d]">{order.createdAt.toLocaleDateString('ko-KR')}</p>
          </div>
          <p className="h-fit rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{orderStatusLabel[order.status]}</p>
        </div>

        <Link href={`/orders/${order.id}`} className="mt-4 flex gap-3 rounded-2xl bg-[#fffaf0] p-3 active:scale-[.99]">
          {firstImage ? (
            <img src={firstImage} alt={firstItem?.name || '주문 상품'} className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-xl bg-[#e5f0dc] text-[#214b36]">
              <PackageCheck size={24} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 font-black text-[#1f2a24]">{firstItem ? firstItem.name : '주문 상품'}</p>
            <p className="mt-1 text-xs font-bold text-[#7a6b4d]">
              {order.items.length > 1 ? `외 ${order.items.length - 1}건 · ` : ''}총 {itemCount}개
            </p>
            <p className="mt-2 text-base font-black text-[#214b36]">{won(order.totalAmount)}</p>
          </div>
          <ChevronRight size={18} className="mt-5 text-[#7a6b4d]" />
        </Link>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Link href={`/orders/${order.id}`} className="rounded-2xl bg-[#214b36] py-3 text-center text-xs font-black text-white">
            상세보기
          </Link>
          {canReview && firstItem ? (
            <Link href={`/reviews?productId=${firstItem.productId}&orderId=${order.id}`} className="flex items-center justify-center gap-1 rounded-2xl bg-[#f1ead9] py-3 text-xs font-black text-[#5b5141]">
              <Star size={14} /> 후기
            </Link>
          ) : (
            <span className="flex items-center justify-center gap-1 rounded-2xl bg-[#f6f1e7] py-3 text-xs font-black text-[#b2a282]">
              <Star size={14} /> 결제 후
            </span>
          )}
          <Link href="/inquiries/board" className="flex items-center justify-center gap-1 rounded-2xl bg-[#f1ead9] py-3 text-xs font-black text-[#5b5141]">
            <MessageCircle size={14} /> 문의
          </Link>
        </div>
        <OrderActionButtons orderId={order.id} status={order.status} />
      </div>;
    })}
    {!orders.length && <div className="rounded-3xl bg-white p-8 text-center text-sm text-[#7a6b4d]"><ShoppingBag className="mx-auto text-[#668f6b]" size={42} /><p className="mt-4 font-black text-[#1f2a24]">해당 상태의 주문내역이 없어요.</p></div>}
    </div>
  </div>;
}
