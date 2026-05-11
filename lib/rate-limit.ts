import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getClientIp(headerList: Headers) {
  const forwardedFor = headerList.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwardedFor || headerList.get('x-real-ip') || 'local';
}

export async function rateLimit(key: string, limit: number, windowMs: number) {
  const headerList = await headers();
  const ip = getClientIp(headerList);
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return null;
  }

  current.count += 1;
  if (current.count <= limit) return null;

  const retryAfter = Math.ceil((current.resetAt - now) / 1000);
  return NextResponse.json(
    { message: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'Cache-Control': 'no-store',
      },
    },
  );
}
