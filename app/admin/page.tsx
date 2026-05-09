import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
export const dynamic = 'force-dynamic';
export default async function AdminPage() { const admin = await requireAdmin(); if (!admin) redirect('/login'); return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">아이엠농부 Admin</h1><div className="mt-5 grid gap-3"><Link href="/admin/orders" className="rounded-2xl bg-white p-4 font-bold">주문관리</Link><Link href="/admin/members" className="rounded-2xl bg-white p-4 font-bold">회원관리</Link><Link href="/admin/products" className="rounded-2xl bg-white p-4 font-bold">상품관리</Link><Link href="/admin/inquiries" className="rounded-2xl bg-white p-4 font-bold">문의 답변</Link></div></div>; }
