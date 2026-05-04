import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { Search, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

const categories = [
  { label: '유기농', emoji: '🌱', value: '유기농' },
  { label: '과일', emoji: '🍎', value: '과일' },
  { label: '건어물', emoji: '🐟', value: '수산물' },
  { label: '생활품', emoji: '🧴', value: '생활용품' },
];

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 8,
    orderBy: { createdAt: 'desc' },
  });

  const newProducts = products.slice(0, 5);
  const categoryProducts = products.slice(0, 3);

  return (
    <div className="bg-white pb-10">
      {/* 검색창 */}
      <section className="px-6 pt-5">
        <div className="flex h-[58px] items-center gap-3 rounded-[22px] bg-[#f1f1f1] px-5 text-[#777]">
          <Search size={26} strokeWidth={2.2} />
          <span className="text-[16px] font-medium">
            자연이 키운 건강한 먹거리를 검색해보세요
          </span>
        </div>
      </section>

      {/* 카테고리 원형 메뉴 */}
      <section className="border-b border-[#eeeeee] px-6 pb-6 pt-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          {categories.map((cat, index) => (
            <Link
              key={cat.value}
              href={`/products/market?category=${encodeURIComponent(cat.value)}`}
              className="flex flex-col items-center gap-3"
            >
              <div
                className={`flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl ${
                  index === 0 ? 'bg-[#6f9878]' : 'bg-[#f2f2f2]'
                }`}
              >
                {cat.emoji}
              </div>
              <span className="text-[15px] font-bold text-[#1f2a24]">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Weekly Best 배너 */}
      <section className="px-6 pt-7">
        <Link
          href="/products/market"
          className="relative block h-[220px] overflow-hidden rounded-[24px] bg-[#eee4d5]"
        >
          <img
            src="/banners/weekly-best.jpg"
            alt="이번 주 인기 상품 모음"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#efe4d1]/95 via-[#efe4d1]/70 to-transparent" />

          <div className="relative z-10 p-6">
            <span className="inline-flex bg-[#668f6b] px-3 py-1 text-[13px] font-bold text-white">
              WEEKLY BEST
            </span>

            <h1 className="mt-5 text-[30px] font-black leading-[1.18] text-[#252837]">
              이번 주
              <br />
              인기 상품 모음
            </h1>

            <p className="mt-4 text-[14px] leading-6 text-[#333]">
              믿을 수 있는 자연의 선물
              <br />
              지금 가장 사랑받는 상품을 만나보세요
            </p>

            <span className="mt-5 inline-flex items-center gap-3 rounded-full bg-[#668f6b] px-5 py-3 text-[14px] font-bold text-white">
              더 알아보기 <ChevronRight size={18} />
            </span>
          </div>
        </Link>
      </section>

      {/* 신상품 */}
      <section className="pt-8">
        <div className="flex items-center justify-between px-6">
          <h2 className="text-[24px] font-black text-[#232633]">신상품</h2>
          <Link
            href="/products/market"
            className="flex items-center gap-1 text-[15px] font-medium text-[#222]"
          >
            전체보기 <ChevronRight size={18} />
          </Link>
        </div>

        <div className="mt-5 flex gap-4 overflow-x-auto px-6 pb-2">
          {newProducts.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="w-[168px] shrink-0 overflow-hidden rounded-[20px] border border-[#eee] bg-white"
            >
              <img
                src={p.image}
                alt={p.name}
                className="h-[150px] w-full object-cover"
              />

              <div className="p-4">
                <p className="line-clamp-1 text-[16px] font-black text-[#242733]">
                  {p.name}
                </p>
                <p className="mt-1 line-clamp-1 text-[13px] text-[#777]">
                  {p.description}
                </p>
                <p className="mt-3 text-[18px] font-black text-[#242733]">
                  {won(p.price)}
                </p>

                <button className="mt-4 w-full rounded-full bg-[#668f6b] py-3 text-[14px] font-bold text-white">
                  담기
                </button>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 카테고리 추천 */}
      <section className="pt-8">
        <div className="flex items-center justify-between px-6">
          <h2 className="text-[24px] font-black text-[#232633]">
            카테고리 추천
          </h2>
          <Link
            href="/products/market"
            className="flex items-center gap-1 text-[15px] font-medium text-[#222]"
          >
            전체보기 <ChevronRight size={18} />
          </Link>
        </div>

        <div className="mt-5 flex gap-3 overflow-x-auto px-6 pb-8">
          {categoryProducts.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="w-[132px] shrink-0 overflow-hidden rounded-[18px] border border-[#eee] bg-white"
            >
              <img
                src={p.image}
                alt={p.name}
                className="h-[112px] w-full object-cover"
              />

              <div className="p-3">
                <p className="text-[14px] font-black text-[#222]">
                  {p.category}
                </p>
                <p className="mt-1 line-clamp-1 text-[11px] text-[#777]">
                  {p.description}
                </p>
                <span className="mt-3 inline-flex rounded-full bg-[#668f6b] px-3 py-2 text-[11px] font-bold text-white">
                  상품 보러가기
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}