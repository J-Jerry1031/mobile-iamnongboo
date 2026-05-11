import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { AdminReviewToggleButton } from '@/components/AdminReviewToggleButton';

export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/reviews&reason=protected');

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      product: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    take: 100,
  });

  return (
    <div className="px-5 pb-8 pt-3">
      <Link href="/admin" className="mb-3 inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
        <ChevronLeft size={18} /> 관리자
      </Link>

      <section className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">ADMIN</p>
        <h1 className="mt-2 text-2xl font-black">후기관리</h1>
        <p className="mt-2 text-sm text-white/75">사진 후기, 도움돼요, 노출 여부를 확인해요.</p>
      </section>

      <div className="mt-5 space-y-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-3xl bg-white p-4 text-sm shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#214b36]">{review.product.name}</p>
                <p className="mt-1 text-xs text-[#7a6b4d]">
                  {review.user?.name || '탈퇴/비회원'} · {new Intl.DateTimeFormat('ko-KR').format(review.createdAt)}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${review.isHidden ? 'bg-red-50 text-red-600' : 'bg-[#e5f0dc] text-[#214b36]'}`}>
                {review.isHidden ? '숨김' : '노출'}
              </span>
            </div>
            <p className="mt-3 text-[#214b36]">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
            {review.photoUrl && <img src={review.photoUrl} alt="후기 사진" className="mt-3 aspect-square w-24 rounded-2xl object-cover" />}
            <p className="mt-3 leading-6">{review.content}</p>
            <p className="mt-2 text-xs font-bold text-[#7a6b4d]">도움돼요 {review.helpfulCount}</p>
            <AdminReviewToggleButton reviewId={review.id} isHidden={review.isHidden} />
          </div>
        ))}
        {!reviews.length && <p className="rounded-3xl bg-white p-5 text-sm">등록된 후기가 없어요.</p>}
      </div>
    </div>
  );
}
