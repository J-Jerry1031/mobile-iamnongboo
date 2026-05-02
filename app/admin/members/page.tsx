import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export default async function AdminMembersPage() { const admin = await requireAdmin(); if (!admin) redirect('/login'); const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } }); return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">회원관리</h1><div className="mt-5 space-y-3">{users.map(u => <div key={u.id} className="rounded-3xl bg-white p-4 text-sm"><p className="font-black">{u.name}</p><p>{u.email}</p><p>{u.phone}</p><p>{u.role}</p></div>)}</div></div>; }
