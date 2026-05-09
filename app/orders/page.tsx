import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { OrderActionButtons } from '@/components/OrderActionButtons';
import { PackageCheck, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const orders = await prisma.order.findMany({ where: user.role === 'ADMIN' ? {} : { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { items: true } });
  const statusLabel = {
    READY: '결제대기',
    PAID: '결제완료',
    CANCEL_REQUESTED: '취소요청',
    CANCELED: '취소완료',
    RETURN_REQUESTED: '반품요청',
    RETURNED: '반품완료',
  } as const;
  return <div className="px-5 pt-5">
    <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
      <p className="text-[12px] font-bold text-[#f5d87a]">ORDERS</p>
      <h1 className="mt-2 text-2xl font-black">주문내역</h1>
      <p className="mt-2 text-[13px] text-white/75">결제 상태와 주문 상품을 확인할 수 있어요.</p>
    </div>
    <div className="mt-5 space-y-4">{orders.map((order) => <div key={order.id} className="rounded-3xl bg-white p-5 text-sm shadow-sm">
      <div className="flex justify-between gap-3">
        <div>
          <p className="font-black">{order.orderNo}</p>
          <p className="mt-1 text-xs text-[#7a6b4d]">{order.createdAt.toLocaleDateString('ko-KR')}</p>
        </div>
        <p className="h-fit rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{statusLabel[order.status]}</p>
      </div>
      <div className="mt-4 space-y-2">{order.items.map((item) => <p key={item.id} className="flex items-center gap-2"><PackageCheck size={15} className="text-[#668f6b]" /> {item.name} × {item.quantity}</p>)}</div>
      <p className="mt-4 text-base font-black text-[#214b36]">{won(order.totalAmount)}</p>
      <OrderActionButtons orderId={order.id} status={order.status} />
    </div>)}
    {!orders.length && <div className="rounded-3xl bg-white p-8 text-center text-sm text-[#7a6b4d]"><ShoppingBag className="mx-auto text-[#668f6b]" size={42} /><p className="mt-4 font-black text-[#1f2a24]">아직 주문내역이 없어요.</p></div>}
    </div>
  </div>;
}
