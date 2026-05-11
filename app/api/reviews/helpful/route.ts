import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asRecord, safeCuid } from '@/lib/security';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const limited = await rateLimit('review-helpful', 60, 60_000);
  if (limited) return limited;

  const body = asRecord(await req.json());
  const reviewId = safeCuid(body.reviewId);

  if (!reviewId) {
    return NextResponse.json({ message: '후기를 찾을 수 없어요.' }, { status: 400 });
  }

  try {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
      select: { helpfulCount: true },
    });

    return NextResponse.json(review);
  } catch {
    return NextResponse.json({ message: '후기를 찾을 수 없어요.' }, { status: 404 });
  }
}
