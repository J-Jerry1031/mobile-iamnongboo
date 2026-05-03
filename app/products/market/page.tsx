import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { ProductImage } from '@/components/ProductImage';

export const dynamic = 'force-dynamic';

const categories = [
  { label: '전체', value: '' },
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
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || '';

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(category ? { category } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">
        {category ? `${category} 상품` : '오늘의 상품'}
      </h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const active = cat.value === category;

          return (
            <Link
              key={cat.label}
              href={cat.value ? `/products/market?category=${encodeURIComponent(cat.value)}` : '/products/market'}
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

      <div className="mt-5 grid grid-cols-2 gap-4">
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
            <p className="mt-2 text-sm font-black">{p.name}</p>
            <p className="mt-1 text-sm font-bold text-[#214b36]">
              {won(p.price)}
            </p>
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