import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  Apple,
  Fish,
  Leaf,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const categories = [
  { label: '유기농', icon: Leaf, value: '유기농' },
  { label: '과일', icon: Apple, value: '과일' },
  { label: '수산', icon: Fish, value: '수산물' },
  { label: '반찬', icon: PackageCheck, value: '반찬' },
];

const trustItems = [
  { label: '산지직송', detail: '오늘 들어온 신선함', icon: Truck },
  { label: '엄선품질', detail: '직접 고른 상품만', icon: BadgeCheck },
  { label: '100% 리콜', detail: '문제 상품 바로 보상', icon: ShieldCheck },
];

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    take: 8,
    orderBy: { createdAt: 'desc' },
  });

  const newProducts = products.slice(0, 5);
  const categoryProducts = products.slice(0, 3);

  return (
    <div className="bg-white pb-12">
      {/* 검색창 */}
      <section className="px-6 pt-5">
        <Link
          href="/products/market"
          className="flex h-[50px] items-center gap-3 rounded-[20px] bg-[#f1f1f1] px-5 text-[#777]"
        >
          <Search size={22} strokeWidth={2.2} />
          <span className="text-[14px] font-medium">
            자연이 키운 건강한 먹거리를 검색해보세요
          </span>
        </Link>
      </section>

      <section className="px-6 pt-4">
        <div className="grid grid-cols-3 gap-2 rounded-[20px] bg-[#fcfbf6] p-3 ring-1 ring-[#eadfce]">
          {trustItems.map(({ label, detail, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon className="mx-auto text-[#668f6b]" size={20} strokeWidth={2} />
              <p className="mt-1 text-[11px] font-black text-[#1f2a24]">{label}</p>
              <p className="mt-0.5 text-[9px] font-medium text-[#8a7a63]">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 카테고리 원형 메뉴 */}
      <section className="border-b border-[#eeeeee] px-6 pb-6 pt-6">
        <div className="grid grid-cols-4 gap-4 text-center">
          {categories.map((cat, index) => {
            const Icon = cat.icon;

            return (
            <Link
              key={cat.value}
              href={`/products/market?category=${encodeURIComponent(cat.value)}`}
              className="flex flex-col items-center gap-3"
            >
              <div
                className={`flex h-[62px] w-[62px] items-center justify-center rounded-full ${
                  index === 0 ? 'bg-[#6f9878] text-white' : 'bg-[#f2f2f2]'
                }`}
              >
                <Icon size={27} strokeWidth={1.8} />
              </div>
              <span className="text-[13px] font-bold text-[#1f2a24]">
                {cat.label}
              </span>
            </Link>
          )})}
        </div>
      </section>

      {/* Weekly Best 배너 */}
      <section className="px-6 pt-7">
        <Link
          href="/products/market"
          className="relative block h-[220px] overflow-hidden rounded-[22px] bg-[#eee4d5]"
        >
          <img
            src="/story/organic.jpg"
            alt="이번 주 인기 상품 모음"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#efe4d1]/95 via-[#efe4d1]/75 to-white/10" />

          <div className="relative z-10 p-6">
            <span className="inline-flex bg-[#668f6b] px-3 py-1 text-[13px] font-bold text-white">
              WEEKLY BEST
            </span>

            <h1 className="mt-5 text-[28px] font-black leading-[1.18] text-[#252837]">
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
              <div className="relative">
              <img
                src={p.image}
                alt={p.name}
                className="h-[150px] w-full object-cover"
              />
                {p.badge && (
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-[#214b36]">
                    {p.badge}
                  </span>
                )}
              </div>

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
                <p className="mt-1 text-[11px] font-bold text-[#668f6b]">
                  산지직송 · 오늘 출고 가능
                </p>

                <span className="mt-4 block w-full rounded-full bg-[#668f6b] py-3 text-center text-[14px] font-bold text-white">
                  자세히 보기
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 pt-5">
        <Link
          href="/products/market"
          className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-[22px] bg-[#214b36] p-5 text-white"
        >
          <div>
            <p className="text-[12px] font-bold text-[#f5d87a]">FARMER PICK</p>
            <h2 className="mt-2 text-[22px] font-black leading-tight">
              오늘 가장 신선한 상품을
              <br />
              먼저 만나보세요
            </h2>
            <p className="mt-3 text-[12px] leading-5 text-white/75">
              재고와 출고 가능 상품을 기준으로 추천해요.
            </p>
          </div>
          <PackageCheck size={42} strokeWidth={1.6} />
        </Link>
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

      <section className="px-6 pb-4 pt-2">
        <div className="rounded-[22px] bg-[#fcfbf6] p-5 ring-1 ring-[#eadfce]">
          <div className="flex items-center gap-3">
            <Leaf className="text-[#668f6b]" size={24} />
            <div>
              <p className="text-[15px] font-black text-[#1f2a24]">
                아이엠농부 약속
              </p>
              <p className="mt-1 text-[12px] leading-5 text-[#7a6b4d]">
                신선하지 않으면 교환·환불로 책임집니다.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-bold text-[#5b5141]">
            <span className="rounded-full bg-white px-3 py-2">
              <Truck className="mr-1 inline" size={14} /> 산지 직송
            </span>
            <span className="rounded-full bg-white px-3 py-2">
              <Clock3 className="mr-1 inline" size={14} /> 빠른 출고
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
