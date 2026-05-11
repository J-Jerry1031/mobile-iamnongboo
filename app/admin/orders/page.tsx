import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { maskAddress, maskPhone } from '@/lib/privacy';
import { writePrivacyAccessLog } from '@/lib/privacy-audit';
import { AdminOrderButtons } from '@/components/AdminOrderButtons';
import { Clock3, PackageCheck, Phone, UserRound } from 'lucide-react';
import { orderStatusLabel } from '@/lib/order-status';
export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/orders&reason=protected');

  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true, user: true } });
  await writePrivacyAccessLog({
    adminId: admin.id,
    action: 'ORDER_LIST_VIEW',
    targetType: 'ORDER',
    summary: `관리자 주문 목록 조회 ${orders.length}건`,
  });
  const todayCount = orders.filter((order) => order.createdAt.toDateString() === new Date().toDateString()).length;
  const paidCount = orders.filter((order) => order.status === 'PAID').length;
  const requestCount = orders.filter((order) => ['CANCEL_REQUESTED', 'RETURN_REQUESTED'].includes(order.status)).length;

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">ADMIN ORDERS</p>
        <h1 className="mt-2 text-2xl font-black">주문관리</h1>
        <p className="mt-2 text-[13px] text-white/75">결제, 취소, 반품 요청을 한 곳에서 처리해요.</p>
      </div>

      <section className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['오늘 주문', todayCount],
          ['결제완료', paidCount],
          ['요청', requestCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-3">
            <p className="text-lg font-black text-[#214b36]">{value}</p>
            <p className="mt-1 text-[11px] font-bold text-[#7a6b4d]">{label}</p>
          </div>
        ))}
      </section>

      <div className="mt-5 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-3xl bg-white p-4 text-sm shadow-sm">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-black text-[#1f2a24]">{order.orderNo}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-[#7a6b4d]">
                  <Clock3 size={13} /> {order.createdAt.toLocaleString('ko-KR')}
                </p>
              </div>
              <p className="h-fit rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">
                {orderStatusLabel[order.status]}
              </p>
            </div>

            <div className="mt-4 grid gap-2 rounded-2xl bg-[#fffaf0] p-3 text-[#5b5141]">
              <p className="flex items-center gap-2"><UserRound size={15} className="text-[#668f6b]" /> {order.buyerName}</p>
              <p className="flex items-center gap-2"><Phone size={15} className="text-[#668f6b]" /> {maskPhone(order.buyerPhone)}</p>
              {order.address && <p className="text-xs font-bold leading-5 text-[#7a6b4d]">{maskAddress(order.address)}</p>}
            </div>

            <div className="mt-3 space-y-2">
              {order.items.map((item) => (
                <p key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#fcfbf6] px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <PackageCheck size={15} className="shrink-0 text-[#668f6b]" />
                    <span className="truncate">{item.name}</span>
                  </span>
                  <span className="shrink-0 font-black text-[#214b36]">× {item.quantity}</span>
                </p>
              ))}
            </div>

            <p className="mt-4 text-base font-black text-[#214b36]">{won(order.totalAmount)}</p>
            <AdminOrderButtons orderId={order.id} status={order.status} />
          </div>
        ))}
        {!orders.length && <p className="rounded-3xl bg-white p-5 text-sm">주문이 아직 없어요.</p>}
      </div>
    </div>
  );
}
