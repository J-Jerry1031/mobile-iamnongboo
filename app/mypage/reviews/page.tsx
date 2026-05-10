import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { ChevronLeft, Star } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MyReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/mypage/reviews&reason=protected');

  const reviews = await prisma.review.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  });

  return (
    <div className="px-5 pt-5">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
        <ChevronLeft size={18} />
        마이페이지
      </Link>
      <div className="mt-4 rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">REVIEWS</p>
        <h1 className="mt-2 text-2xl font-black">후기 관리</h1>
        <p className="mt-2 text-[13px] text-white/75">내가 남긴 상품 후기를 확인해요.</p>
      </div>

      <div className="mt-5 space-y-3">
        {reviews.map((review) => (
          <Link
            key={review.id}
            href={`/products/${review.productId}`}
            className="block rounded-3xl bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-black text-[#1f2a24]">{review.product.name}</p>
              <span className="flex items-center gap-1 rounded-full bg-[#fffaf0] px-3 py-1 text-xs font-black text-[#214b36]">
                <Star size={13} className="fill-[#f5d87a] text-[#f5d87a]" />
                {review.rating}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#5b5141]">{review.content}</p>
            <p className="mt-3 text-xs font-bold text-[#7a6b4d]">
              {review.createdAt.toLocaleDateString('ko-KR')}
            </p>
          </Link>
        ))}

        {!reviews.length && (
          <div className="rounded-3xl bg-white p-8 text-center text-sm text-[#7a6b4d]">
            <Star className="mx-auto text-[#668f6b]" size={42} />
            <p className="mt-4 font-black text-[#1f2a24]">아직 작성한 후기가 없어요.</p>
            <p className="mt-2 leading-6">구매한 상품 상세페이지에서 후기를 남길 수 있어요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
