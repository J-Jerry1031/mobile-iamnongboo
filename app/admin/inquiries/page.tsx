import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { AdminInquiryAnswerForm } from '@/components/AdminInquiryAnswerForm';
import { MessageCircle, UserRound } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminInquiriesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login');

  const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true } });
  const openCount = inquiries.filter((inquiry) => inquiry.status === 'OPEN').length;

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">ADMIN INQUIRIES</p>
        <h1 className="mt-2 text-2xl font-black">문의 답변</h1>
        <p className="mt-2 text-[13px] text-white/75">고객 문의에 답변하고 처리 상태를 관리해요.</p>
      </div>

      <section className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-white p-3">
          <p className="text-lg font-black text-[#214b36]">{inquiries.length}</p>
          <p className="mt-1 text-[11px] font-bold text-[#7a6b4d]">전체 문의</p>
        </div>
        <div className="rounded-2xl bg-white p-3">
          <p className="text-lg font-black text-[#214b36]">{openCount}</p>
          <p className="mt-1 text-[11px] font-bold text-[#7a6b4d]">답변대기</p>
        </div>
      </section>

      <div className="mt-5 space-y-4">
        {inquiries.map((inquiry) => (
          <div key={inquiry.id} className="rounded-3xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#1f2a24]">{inquiry.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-[#7a6b4d]">
                  <UserRound size={13} /> {inquiry.user?.name || '비회원'} · {inquiry.createdAt.toLocaleDateString('ko-KR')}
                </p>
              </div>
              <span className="rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">
                {inquiry.status === 'ANSWERED' ? '답변완료' : '답변대기'}
              </span>
            </div>
            <p className="mt-3 rounded-2xl bg-[#fffaf0] p-3 text-sm leading-6 text-[#5b5141]">{inquiry.content}</p>
            {inquiry.answer && (
              <p className="mt-3 flex gap-2 rounded-2xl bg-[#e5f0dc] p-3 text-sm leading-6 text-[#214b36]">
                <MessageCircle className="mt-0.5 shrink-0" size={16} />
                {inquiry.answer}
              </p>
            )}
            <AdminInquiryAnswerForm inquiryId={inquiry.id} initialAnswer={inquiry.answer} />
          </div>
        ))}
        {!inquiries.length && <p className="rounded-3xl bg-white p-5 text-sm text-[#7a6b4d]">등록된 문의가 없어요.</p>}
      </div>
    </div>
  );
}
