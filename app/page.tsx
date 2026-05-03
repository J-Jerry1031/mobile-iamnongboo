import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Footer } from '@/components/Footer';
import { won } from '@/lib/format';
import { ProductImage } from '@/components/ProductImage';
import { HomeHeroSlider } from '@/components/HomeHeroSlider';

export const dynamic = 'force-dynamic';

const homeCategories = [
  { label: '🍎 과일', value: '과일' },
  { label: '🥬 채소', value: '채소' },
  { label: '🐟 수산', value: '수산물' },
  { label: '🍠 간식', value: '간식' },
];

function ProductSection({
  title,
  subtitle,
  products,
}: {
  title: string;
  subtitle?: string;
  products: any[];
}) {
  if (!products.length) return null;

  return (
    <section className="px-5 pt-8">
      <div className="mb-4">
        <h2 className="text-xl font-black text-[#214b36]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#7a6b4d]">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="block rounded-3xl bg-white p-3 shadow-sm active:scale-[.99]"
          >
            <ProductImage src={p.image} name={p.name} />

            {p.badge && (
              <p className="mt-3 inline-flex rounded-full bg-[#e5f0dc] px-2 py-1 text-[10px] font-black text-[#214b36]">
                {p.badge}
              </p>
            )}

            <p className="mt-2 line-clamp-2 text-sm font-black">{p.name}</p>

            <p className="mt-1 text-sm font-bold text-[#214b36]">
              {won(p.price)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const farmerPicks = await prisma.product.findMany({
    where: {
      isActive: true,
      isFarmerPick: true,
    },
    take: 5,
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  const recommended = await prisma.product.findMany({
    where: { isActive: true },
    take: 6,
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  const bestsellerGroups = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        status: 'PAID',
      },
    },
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: 6,
  });

  const bestsellerIds = bestsellerGroups.map((x) => x.productId);

  const bestsellerProductsRaw = bestsellerIds.length
    ? await prisma.product.findMany({
        where: {
          id: { in: bestsellerIds },
          isActive: true,
        },
      })
    : [];

  const bestsellerProducts = bestsellerIds
    .map((id) => bestsellerProductsRaw.find((p) => p.id === id))
    .filter(Boolean);

  const fallbackBestsellers = bestsellerProducts.length
    ? bestsellerProducts
    : recommended.slice(0, 4);

  const slidesSource = farmerPicks.length ? farmerPicks : recommended.slice(0, 3);

  const slides = slidesSource.map((p) => ({
    id: p.id,
    title: p.name,
    subtitle: p.description,
    image: p.image,
    href: `/products/${p.id}`,
  }));

  return (
    <>
      <HomeHeroSlider slides={slides} />

      <section className="px-5 pt-7">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold text-[#214b36]">
          {homeCategories.map((cat) => (
            <Link
              key={cat.value}
              href={`/products/market?category=${encodeURIComponent(cat.value)}`}
              className="block rounded-2xl bg-white p-3 shadow-sm active:scale-[.98]"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      <ProductSection
        title="오늘의 농부 PICK"
        subtitle="아이엠농부가 오늘 가장 먼저 추천하는 상품이에요."
        products={farmerPicks.length ? farmerPicks : recommended.slice(0, 4)}
      />

      <ProductSection
        title="추천상품"
        subtitle="동탄 아이엠농부에서 지금 보기 좋은 신선상품이에요."
        products={recommended}
      />

      <ProductSection
        title="베스트셀러"
        subtitle="실제 주문 데이터를 기준으로 많이 팔린 상품이에요."
        products={fallbackBestsellers as any[]}
      />

      <Footer />
    </>
  );
}