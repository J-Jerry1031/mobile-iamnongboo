import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Footer } from '@/components/Footer';
import { won } from '@/lib/format';
import { ProductImage } from '@/components/ProductImage';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await prisma.product.findMany({ where: { isActive: true }, take: 8, orderBy: { createdAt: 'desc' } });

  return (
    <>
      <section className="px-5 pt-5">
        <div className="rounded-[2rem] bg-[#214b36] p-6 text-white shadow-xl shadow-green-900/20">
          <p className="text-sm text-[#d8e6cd]">Real Farmer, Real Freshness</p>
          <h1 className="mt-3 text-3xl font-black leading-tight">농부가 고른<br />오늘의 신선함</h1>
          <p className="mt-3 text-sm leading-6 text-[#edf3e8]">동탄 아이엠농부에서 매일 선별한 과일, 채소, 유기농 상품을 모바일로 편하게 만나보세요.</p>
          <Link href="/products/market" className="mt-5 inline-flex rounded-full bg-[#f5d87a] px-5 py-3 text-sm font-black text-[#214b36]">오늘 상품 보기</Link>
        </div>
      </section>

      <section className="px-5 pt-7">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-[#214b36]">
          {['🍎 과일', '🥬 채소', '🐟 수산', '🍠 간식'].map((x) => <div key={x} className="rounded-2xl bg-white p-3 shadow-sm">{x}</div>)}
        </div>
      </section>

      <section className="px-5 pt-8">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-black text-[#214b36]">추천 상품</h2>
          <Link href="/products/market" className="text-sm font-bold text-[#7a6b4d]">전체보기</Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/products/${p.id}`} className="block rounded-3xl bg-white p-3 shadow-sm active:scale-[.99]">
              <ProductImage src={p.image} name={p.name} />
              {p.badge && <p className="mt-3 inline-flex rounded-full bg-[#e5f0dc] px-2 py-1 text-[10px] font-black text-[#214b36]">{p.badge}</p>}
              <p className="mt-2 line-clamp-2 text-sm font-black">{p.name}</p>
              <p className="mt-1 text-sm font-bold text-[#214b36]">{won(p.price)}</p>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </>
  );
}
