import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { maskEmail, maskPhone } from '@/lib/privacy';
import { writePrivacyAccessLog } from '@/lib/privacy-audit';
import { Mail, Phone, ReceiptText, Star, UserRound } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default async function AdminMembersPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/members&reason=protected');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      orders: { select: { id: true, totalAmount: true, status: true } },
      reviews: { select: { id: true } },
      inquiries: { select: { id: true, status: true } },
    },
  });
  await writePrivacyAccessLog({
    adminId: admin.id,
    action: 'MEMBER_LIST_VIEW',
    targetType: 'USER',
    summary: `관리자 회원 목록 조회 ${users.length}명`,
  });

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">ADMIN MEMBERS</p>
        <h1 className="mt-2 text-2xl font-black">회원관리</h1>
        <p className="mt-2 text-[13px] text-white/75">회원 정보와 주문/후기/문의 활동을 확인해요.</p>
      </div>

      <div className="mt-5 space-y-3">
        {users.map((user) => {
          const paidAmount = user.orders
            .filter((order) => order.status === 'PAID')
            .reduce((sum, order) => sum + order.totalAmount, 0);
          const openInquiryCount = user.inquiries.filter((inquiry) => inquiry.status === 'OPEN').length;

          return (
            <div key={user.id} className="rounded-3xl bg-white p-4 text-sm shadow-sm">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e5f0dc] text-[#214b36]">
                  <UserRound size={24} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-[#1f2a24]">{user.name}</p>
                    <span className="rounded-full bg-[#fcfbf6] px-2 py-1 text-[10px] font-black text-[#214b36]">{user.role}</span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#7a6b4d]"><Mail size={13} /> {maskEmail(user.email)}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#7a6b4d]"><Phone size={13} /> {maskPhone(user.phone)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-[#fffaf0] p-3">
                  <ReceiptText className="mx-auto text-[#668f6b]" size={17} />
                  <p className="mt-1 font-black text-[#214b36]">{user.orders.length}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-[#7a6b4d]">주문</p>
                </div>
                <div className="rounded-2xl bg-[#fffaf0] p-3">
                  <Star className="mx-auto text-[#668f6b]" size={17} />
                  <p className="mt-1 font-black text-[#214b36]">{user.reviews.length}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-[#7a6b4d]">후기</p>
                </div>
                <div className="rounded-2xl bg-[#fffaf0] p-3">
                  <p className="text-base font-black text-[#214b36]">{openInquiryCount}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-[#7a6b4d]">답변대기</p>
                </div>
              </div>

              <div className="mt-3 flex justify-between rounded-2xl bg-[#fcfbf6] px-3 py-2 text-xs font-bold">
                <span className="text-[#7a6b4d]">결제완료 누적</span>
                <span className="text-[#214b36]">{won(paidAmount)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
