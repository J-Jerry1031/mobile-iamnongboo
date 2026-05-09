import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { ProductImage } from '@/components/ProductImage';
import { ArrowDownUp, BadgeCheck, Search, SlidersHorizontal, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const categories = [
  { label: '전체', value: '' },
  { label: '유기농', value: '유기농' },
  { label: '과일', value: '과일' },
  { label: '채소', value: '채소' },
  { label: '수산', value: '수산물' },
  { label: '간식', value: '간식' },
  { label: '유제품', value: '유제품' },
  { label: '음료', value: '음료' },
  { label: '반찬', value: '반찬' },
];

export default async function ProductList({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || '';
  const sort = params.sort || 'new';
  const orderBy =
    sort === 'price-low'
      ? { price: 'asc' as const }
      : sort === 'price-high'
        ? { price: 'desc' as const }
        : { createdAt: 'desc' as const };

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
    orderBy,
  });

  const buildHref = (next: { category?: string; sort?: string }) => {
    const nextCategory = next.category ?? category;
    const nextSort = next.sort ?? sort;
    const query = new URLSearchParams();
    if (nextCategory) query.set('category', nextCategory);
    if (nextSort && nextSort !== 'new') query.set('sort', nextSort);
    const qs = query.toString();
    return qs ? `/products/market?${qs}` : '/products/market';
  };

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">MARKET</p>
        <h1 className="mt-2 text-2xl font-black">
          {category ? `${category} 상품` : '오늘의 상품'}
        </h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">
          산지에서 들어온 상품을 신선도와 판매 상태 기준으로 보여드려요.
        </p>
      </div>

      <Link
        href="/products/market"
        className="mt-4 flex h-12 items-center gap-3 rounded-[18px] bg-white px-4 text-[13px] font-bold text-[#7a6b4d]"
      >
        <Search size={18} />
        상품명, 카테고리로 찾기
      </Link>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const active = cat.value === category;

          return (
            <Link
              key={cat.label}
              href={buildHref({ category: cat.value })}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
                active
                  ? 'bg-[#214b36] text-white'
                  : 'bg-white text-[#214b36]'
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="flex items-center gap-1 text-[12px] font-bold text-[#7a6b4d]">
          <SlidersHorizontal size={15} />
          총 {products.length}개
        </p>
        <div className="flex gap-2">
          {[
            { label: '신상품순', value: 'new' },
            { label: '낮은가격순', value: 'price-low' },
            { label: '높은가격순', value: 'price-high' },
          ].map((option) => (
            <Link
              key={option.value}
              href={buildHref({ sort: option.value })}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
                sort === option.value
                  ? 'bg-[#668f6b] text-white'
                  : 'bg-white text-[#5b5141]'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="block rounded-3xl bg-white p-3 shadow-sm active:scale-[.99]"
          >
            <div className="relative">
              <ProductImage src={p.image} name={p.name} />
              {p.stock <= 0 && (
                <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/45 text-sm font-black text-white">
                  품절
                </div>
              )}
              {p.badge && (
                <p className="absolute left-2 top-2 inline-flex rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-[#214b36]">
                  {p.badge}
                </p>
              )}
            </div>
            <p className="mt-2 text-sm font-black">{p.name}</p>
            <p className="mt-1 line-clamp-2 min-h-[34px] text-[11px] leading-[17px] text-[#7a6b4d]">
              {p.description}
            </p>
            <p className="mt-1 text-sm font-bold text-[#214b36]">
              {won(p.price)}
            </p>
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-[#668f6b]">
              <span className="flex items-center gap-1">
                <Truck size={13} /> 산지직송
              </span>
              <span className="flex items-center gap-1">
                <BadgeCheck size={13} /> {p.stock > 0 ? '신선보장' : '입고대기'}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {!products.length && (
        <p className="mt-8 rounded-3xl bg-white p-5 text-sm text-[#7a6b4d]">
          이 카테고리에 등록된 상품이 아직 없어요.
        </p>
      )}
    </div>
  );
}
