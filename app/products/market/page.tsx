import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { ProductImage } from '@/components/ProductImage';

export const dynamic = 'force-dynamic';

export default async function ProductList() {
  const products = await prisma.product.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  return (
    <div className="px-5 pt-5">
      <h1 className="text-2xl font-black text-[#214b36]">오늘의 상품</h1>
      <p className="mt-2 text-sm text-[#7a6b4d]">아이엠농부가 오늘 추천하는 신선상품이에요.</p>
      <div className="mt-5 grid grid-cols-2 gap-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="block rounded-3xl bg-white p-3 shadow-sm active:scale-[.99]">
            <ProductImage src={p.image} name={p.name} />
            {p.badge && <p className="mt-3 inline-flex rounded-full bg-[#e5f0dc] px-2 py-1 text-[10px] font-black text-[#214b36]">{p.badge}</p>}
            <p className="mt-2 text-sm font-black">{p.name}</p>
            <p className="mt-1 text-sm font-bold text-[#214b36]">{won(p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
