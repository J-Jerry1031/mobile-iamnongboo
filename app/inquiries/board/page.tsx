import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';

async function createInquiry(formData: FormData) { 'use server'; const user = await getCurrentUser(); await prisma.inquiry.create({ data: { userId: user?.id || null, title: String(formData.get('title')), content: String(formData.get('content')) } }); redirect('/inquiries/board'); }
export const dynamic = 'force-dynamic';
export default async function InquiriesPage() { const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true } }); return <div className="px-5 pt-5"><h1 className="text-2xl font-black text-[#214b36]">문의게시판</h1><form action={createInquiry} className="mt-5 space-y-3 rounded-3xl bg-white p-4"><input name="title" placeholder="문의 제목" className="w-full rounded-2xl bg-[#fffaf0] p-4" /><textarea name="content" placeholder="문의 내용" className="min-h-28 w-full rounded-2xl bg-[#fffaf0] p-4" /><button className="w-full rounded-2xl bg-[#214b36] py-3 font-black text-white">문의 남기기</button></form><div className="mt-5 space-y-3">{inquiries.map(i => <div key={i.id} className="rounded-3xl bg-white p-4"><p className="font-black">{i.title}</p><p className="mt-2 text-sm">{i.content}</p><p className="mt-2 text-xs text-[#7a6b4d]">{i.status}</p></div>)}</div></div>; }
