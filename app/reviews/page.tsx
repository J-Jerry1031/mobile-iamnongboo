import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';

const REVIEW_POINT = 100;

async function createReview(formData: FormData) {
  'use server';

  const productId = String(formData.get('productId') || '');
  const rating = Number(formData.get('rating') || 5);
  const content = String(formData.get('content') || '').trim();

  const user = await getCurrentUser();

  if (!user) redirect('/login');
  if (!productId) redirect('/products/market');
  if (!content) redirect(`/reviews?productId=${productId}`);

  const existing = await prisma.review.findFirst({
    where: {
      productId,
      userId: user.id,
    },
  });

  if (existing) {
    await prisma.review.update({
      where: { id: existing.id },
      data: {
        rating,
        content,
      },
    });

    redirect(`/products/${productId}`);
  }

  await prisma.$transaction([
    prisma.review.create({
      data: {
        productId,
        userId: user.id,
        rating,
        content,
      },
    }),

    prisma.user.update({
      where: { id: user.id },
      data: {
        points: {
          increment: REVIEW_POINT,
        },
      },
    }),

    prisma.pointLog.create({
      data: {
        userId: user.id,
        amount: REVIEW_POINT,
        reason: '상품 후기 작성 적립',
        refType: 'REVIEW',
        refId: productId,
      },
    }),
  ]);

  redirect(`/products/${productId}`);
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  if (!user) redirect('/login');

  return (
    <form action={createReview} className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">후기 작성</h1>

      <p className="mt-3 rounded-2xl bg-[#e5f0dc] p-4 text-sm font-bold text-[#214b36]">
        후기 작성 시 {REVIEW_POINT}P가 적립돼요.
      </p>

      <input type="hidden" name="productId" value={params.productId || ''} />

      <select name="rating" className="mt-5 w-full rounded-2xl bg-white p-4">
        <option value="5">★★★★★ 아주 좋아요</option>
        <option value="4">★★★★ 좋아요</option>
        <option value="3">★★★ 보통이에요</option>
        <option value="2">★★ 아쉬워요</option>
        <option value="1">★ 별로예요</option>
      </select>

      <textarea
        name="content"
        placeholder="상품 후기를 남겨주세요"
        className="mt-3 min-h-32 w-full rounded-2xl bg-white p-4"
      />

      <button className="mt-3 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white">
        후기 등록하고 포인트 받기
      </button>
    </form>
  );
}