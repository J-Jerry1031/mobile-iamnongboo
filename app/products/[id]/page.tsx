import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductImage } from '@/components/ProductImage';

export const dynamic = 'force-dynamic';

export default async function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, include: { reviews: { orderBy: { createdAt: 'desc' } } } });
  if (!product) notFound();

  return (
    <div className="px-5 pt-5">
      <ProductImage src={product.image} name={product.name} big />
      {product.badge && <p className="mt-5 inline-flex rounded-full bg-[#e5f0dc] px-3 py-1 text-xs font-black text-[#214b36]">{product.badge}</p>}
      <h1 className="mt-3 text-2xl font-black text-[#1f2a24]">{product.name}</h1>
      <p className="mt-2 text-2xl font-black text-[#214b36]">{won(product.price)}</p>
      <p className="mt-4 rounded-3xl bg-white p-5 text-sm leading-7 text-[#5b5141]">{product.description}</p>
      <AddToCartButton product={{ id: product.id, name: product.name, price: product.price, image: product.image }} />

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black">상품 후기</h2>
          <Link href={`/reviews?productId=${product.id}`} className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#214b36]">후기쓰기</Link>
        </div>
        <div className="mt-4 space-y-3">
          {product.reviews.map((r) => <div key={r.id} className="rounded-3xl bg-white p-4 text-sm"><p>{'⭐'.repeat(r.rating)}</p><p className="mt-2">{r.content}</p></div>)}
          {!product.reviews.length && <p className="rounded-3xl bg-white p-4 text-sm text-[#7a6b4d]">아직 후기가 없어요.</p>}
        </div>
      </section>
    </div>
  );
}
