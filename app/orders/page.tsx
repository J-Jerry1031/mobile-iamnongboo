import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { OrderActionButtons } from '@/components/OrderActionButtons';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const orders = await prisma.order.findMany({ where: user.role === 'ADMIN' ? {} : { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { items: true } });
  return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">주문내역</h1><div className="mt-5 space-y-4">{orders.map((order) => <div key={order.id} className="rounded-3xl bg-white p-5 text-sm shadow-sm"><div className="flex justify-between gap-3"><p className="font-black">{order.orderNo}</p><p className="rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{order.status}</p></div><div className="mt-3 space-y-1">{order.items.map((item) => <p key={item.id}>{item.name} × {item.quantity}</p>)}</div><p className="mt-3 text-base font-black text-[#214b36]">{won(order.totalAmount)}</p><OrderActionButtons orderId={order.id} status={order.status} /></div>)}{!orders.length && <p className="rounded-3xl bg-white p-5 text-sm">아직 주문내역이 없어요.</p>}</div></div>;
}
