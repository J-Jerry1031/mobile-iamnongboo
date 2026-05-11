import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { productCategories, safeProductCategory, safeProductSort, safeText } from '@/lib/security';
import { ProductImage } from '@/components/ProductImage';
import { BadgeCheck, Leaf, Search, SlidersHorizontal, Star, TicketPercent, Truck, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

const categories = [
  { label: '전체', value: '' },
  ...productCategories
    .filter((category) => category !== '생활용품')
    .map((category) => ({ label: category === '수산물' ? '수산' : category, value: category })),
];

export default async function ProductList({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string; free?: string; inStock?: string; pick?: string }>;
}) {
  const params = await searchParams;
  const category = safeProductCategory(params.category);
  const sort = safeProductSort(params.sort);
  const q = safeText(params.q, 50);
  const freeOnly = params.free === '1';
  const inStockOnly = params.inStock === '1';
  const pickOnly = params.pick === '1';
  const orderBy =
    sort === 'price-low'
      ? { price: 'asc' as const }
      : sort === 'price-high'
        ? { price: 'desc' as const }
        : { createdAt: 'desc' as const };

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(freeOnly ? { price: { gte: 30000 } } : {}),
      ...(inStockOnly ? { stock: { gt: 0 } } : {}),
      ...(pickOnly ? { isFarmerPick: true } : {}),
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { category: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
              { badge: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy,
    include: {
      reviews: { select: { rating: true } },
    },
  });

  const buildHref = (next: { category?: string; sort?: string; q?: string; free?: boolean; inStock?: boolean; pick?: boolean }) => {
    const nextCategory = next.category ?? category;
    const nextSort = next.sort ?? sort;
    const nextQ = next.q ?? q;
    const nextFree = next.free ?? freeOnly;
    const nextInStock = next.inStock ?? inStockOnly;
    const nextPick = next.pick ?? pickOnly;
    const query = new URLSearchParams();
    if (nextCategory) query.set('category', nextCategory);
    if (nextQ) query.set('q', nextQ);
    if (nextSort && nextSort !== 'new') query.set('sort', nextSort);
    if (nextFree) query.set('free', '1');
    if (nextInStock) query.set('inStock', '1');
    if (nextPick) query.set('pick', '1');
    const qs = query.toString();
    return qs ? `/products/market?${qs}` : '/products/market';
  };

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">MARKET</p>
        <h1 className="mt-2 text-2xl font-black">
          {q ? `"${q}" 검색결과` : category ? `${category} 상품` : '오늘의 상품'}
        </h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">
          산지에서 들어온 상품을 신선도와 판매 상태 기준으로 보여드려요.
        </p>
      </div>

      <form action="/products/market" className="mt-4 flex h-12 items-center gap-3 rounded-[18px] bg-white px-4 text-[13px] font-bold text-[#7a6b4d]">
        <Search size={18} className="shrink-0" />
        {category && <input type="hidden" name="category" value={category} />}
        {sort !== 'new' && <input type="hidden" name="sort" value={sort} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="상품명, 카테고리, 설명으로 찾기"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9b8d73]"
        />
        {q && (
          <Link href={buildHref({ q: '' })} aria-label="검색어 지우기" className="grid h-8 w-8 place-items-center rounded-full bg-[#f1ead9] text-[#214b36]">
            <X size={15} />
          </Link>
        )}
        <button className="rounded-full bg-[#214b36] px-3 py-2 text-xs font-black text-white">검색</button>
      </form>

      {!q && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {['사과', '유기농', '반찬', '주스'].map((keyword) => (
            <Link key={keyword} href={buildHref({ q: keyword })} className="shrink-0 rounded-full bg-[#fcfbf6] px-3 py-2 text-xs font-black text-[#214b36] ring-1 ring-[#eadfce]">
              {keyword}
            </Link>
          ))}
        </div>
      )}

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

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: '무료배송', active: freeOnly, href: buildHref({ free: !freeOnly }) },
          { label: '품절 제외', active: inStockOnly, href: buildHref({ inStock: !inStockOnly }) },
          { label: '농부추천', active: pickOnly, href: buildHref({ pick: !pickOnly }) },
        ].map((filter) => (
          <Link key={filter.label} href={filter.href} className={`rounded-2xl px-3 py-3 text-center text-xs font-black ${filter.active ? 'bg-[#214b36] text-white' : 'bg-white text-[#214b36]'}`}>
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {products.map((p) => {
          const reviewCount = p.reviews.length;
          const averageRating = reviewCount ? p.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount : 0;
          const couponPrice = Math.max(0, p.price - 3000);
          return (
          <Link key={p.id} href={`/products/${p.id}`} className="block rounded-3xl bg-white p-3 shadow-sm active:scale-[.99]">
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
            <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-[#668f6b]">
              {p.isFarmerPick && <span className="inline-flex items-center gap-1 rounded-full bg-[#e5f0dc] px-2 py-1"><Leaf size={11} /> 추천</span>}
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fffaf0] px-2 py-1"><TicketPercent size={11} /> 쿠폰</span>
            </div>
            <p className="mt-2 text-[15px] font-black leading-snug">{p.name}</p>
            <p className="mt-1 line-clamp-2 min-h-[34px] text-[11px] leading-[17px] text-[#7a6b4d]">
              {p.description}
            </p>
            <p className="mt-2 text-[11px] font-bold text-[#9b8d73] line-through">
              {won(p.price)}
            </p>
            <p className="text-base font-black text-[#214b36]">
              {won(couponPrice)} <span className="text-[10px] text-[#668f6b]">쿠폰가</span>
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#7a6b4d]">
              <Star size={13} className="fill-[#f5d87a] text-[#f5d87a]" />
              {reviewCount ? `${averageRating.toFixed(1)} · 후기 ${reviewCount}` : '첫 후기를 기다려요'}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-[#668f6b]">
              <span className="flex items-center gap-1">
                <Truck size={13} /> 내일 준비
              </span>
              <span className="flex items-center gap-1">
                <BadgeCheck size={13} /> {p.stock > 0 ? `재고 ${p.stock}` : '입고대기'}
              </span>
            </div>
          </Link>
        )})}
      </div>

      {!products.length && (
        <div className="mt-8 rounded-3xl bg-white p-6 text-center text-sm text-[#7a6b4d]">
          <Search className="mx-auto text-[#668f6b]" size={36} />
          <p className="mt-4 font-black text-[#1f2a24]">조건에 맞는 상품이 없어요.</p>
          <p className="mt-2 leading-6">검색어를 줄이거나 다른 카테고리를 확인해보세요.</p>
          <Link href="/products/market" className="mt-5 inline-flex rounded-full bg-[#214b36] px-5 py-3 font-black text-white">
            전체 상품 보기
          </Link>
        </div>
      )}
    </div>
  );
}
