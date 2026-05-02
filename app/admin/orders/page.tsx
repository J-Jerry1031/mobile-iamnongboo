import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AdminOrderButtons } from '@/components/AdminOrderButtons';
export const dynamic = 'force-dynamic';
export default async function AdminOrdersPage() { const admin = await requireAdmin(); if (!admin) redirect('/login'); const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true, user: true } }); return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">주문관리</h1><div className="mt-5 space-y-4">{orders.map((o) => <div key={o.id} className="rounded-3xl bg-white p-4 text-sm shadow-sm"><div className="flex justify-between gap-3"><p className="font-black">{o.orderNo}</p><p className="rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{o.status}</p></div><p className="mt-2">{o.buyerName} / {o.buyerPhone}</p><p className="text-[#7a6b4d]">{o.address}</p><div className="mt-3 space-y-1">{o.items.map((item) => <p key={item.id}>{item.name} × {item.quantity}</p>)}</div><p className="mt-3 text-base font-black text-[#214b36]">{won(o.totalAmount)}</p><AdminOrderButtons orderId={o.id} /></div>)}{!orders.length && <p className="rounded-3xl bg-white p-5 text-sm">주문이 아직 없어요.</p>}</div></div>; }
