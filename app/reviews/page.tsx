import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-lite';
import { reviewableStatuses } from '@/lib/order-status';
import Link from 'next/link';
import { ChevronLeft, Gift, Star } from 'lucide-react';

const REVIEW_POINT = 100;

async function createReview(formData: FormData) {
  'use server';

  const productId = String(formData.get('productId') || '');
  const orderId = String(formData.get('orderId') || '');
  const rating = Number(formData.get('rating') || 5);
  const content = String(formData.get('content') || '').trim();

  const user = await getCurrentUser();

  if (!user) redirect('/login?next=/orders&reason=protected');
  if (!productId) redirect('/orders');
  if (!content) redirect(`/reviews?productId=${productId}${orderId ? `&orderId=${orderId}` : ''}`);

  const purchased = await prisma.order.findFirst({
    where: {
      ...(orderId ? { id: orderId } : {}),
      userId: user.id,
      status: { in: reviewableStatuses as any },
      items: { some: { productId } },
    },
  });

  if (!purchased) redirect('/orders');

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

    redirect(orderId ? `/orders/${orderId}` : `/products/${productId}`);
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

  redirect(orderId ? `/orders/${orderId}` : `/products/${productId}`);
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; orderId?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  const currentReviewPath = `/reviews${params.productId ? `?productId=${params.productId}${params.orderId ? `&orderId=${params.orderId}` : ''}` : ''}`;
  if (!user) redirect(`/login?next=${encodeURIComponent(currentReviewPath)}&reason=protected`);

  const product = params.productId
    ? await prisma.product.findUnique({ where: { id: params.productId } })
    : null;
  const order = params.orderId
    ? await prisma.order.findFirst({ where: { id: params.orderId, userId: user.id }, include: { items: true } })
    : null;
  if (params.productId && params.orderId) {
    const canWrite = order
      && reviewableStatuses.includes(order.status)
      && order.items.some((item) => item.productId === params.productId);
    if (!canWrite) redirect(`/orders/${params.orderId}`);
  }
  const existingReview = params.productId
    ? await prisma.review.findFirst({ where: { productId: params.productId, userId: user.id } })
    : null;

  return (
    <form action={createReview} className="px-5 pb-8 pt-3">
      <Link href={params.orderId ? `/orders/${params.orderId}` : '/orders'} className="mb-3 inline-flex items-center gap-1 text-sm font-black text-[#214b36]">
        <ChevronLeft size={18} /> 돌아가기
      </Link>

      <section className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">REVIEW</p>
        <h1 className="mt-2 text-2xl font-black">{existingReview ? '후기 수정' : '후기 작성'}</h1>
        <p className="mt-2 text-sm leading-6 text-white/75">구매한 상품의 경험을 남겨주세요.</p>
      </section>

      {product && (
        <section className="mt-5 flex gap-3 rounded-3xl bg-white p-4 shadow-sm">
          <img src={product.image} alt={product.name} className="h-20 w-20 rounded-2xl object-cover" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 font-black text-[#1f2a24]">{product.name}</p>
            <p className="mt-2 text-xs font-bold text-[#7a6b4d]">{order?.orderNo || '구매 상품'}</p>
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">
              <Gift size={13} /> 작성 시 {REVIEW_POINT}P
            </p>
          </div>
        </section>
      )}

      <p className="mt-3 rounded-2xl bg-[#e5f0dc] p-4 text-sm font-bold text-[#214b36]">
        {existingReview ? '기존 후기를 수정할 수 있어요.' : `후기 작성 시 ${REVIEW_POINT}P가 적립돼요.`}
      </p>

      <input type="hidden" name="productId" value={params.productId || ''} />
      <input type="hidden" name="orderId" value={params.orderId || ''} />

      <label className="mt-5 block">
        <span className="mb-2 flex items-center gap-2 text-xs font-black text-[#7a6b4d]">
          <Star size={15} className="text-[#668f6b]" /> 만족도
        </span>
        <select name="rating" defaultValue={existingReview?.rating || 5} className="w-full rounded-2xl bg-white p-4 font-bold outline-none focus:ring-2 focus:ring-[#668f6b]">
        <option value="5">★★★★★ 아주 좋아요</option>
        <option value="4">★★★★ 좋아요</option>
        <option value="3">★★★ 보통이에요</option>
        <option value="2">★★ 아쉬워요</option>
        <option value="1">★ 별로예요</option>
        </select>
      </label>

      <textarea
        name="content"
        defaultValue={existingReview?.content || ''}
        placeholder="신선도, 맛, 포장 상태 등 다른 고객에게 도움이 될 내용을 남겨주세요."
        className="mt-3 min-h-40 w-full rounded-2xl bg-white p-4 leading-6 outline-none focus:ring-2 focus:ring-[#668f6b]"
      />

      <button className="mt-3 w-full rounded-2xl bg-[#214b36] py-4 font-black text-white active:scale-[.99]">
        {existingReview ? '후기 수정하기' : '후기 등록하고 포인트 받기'}
      </button>
    </form>
  );
}
