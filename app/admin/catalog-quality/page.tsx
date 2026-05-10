import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { AlertCircle, CheckCircle2, ChevronRight, ImageIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminCatalogQualityPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/catalog-quality&reason=protected');

  const products = await prisma.product.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
  const issues = products.map((product) => {
    const productIssues = [
      product.name.length < 3 ? '상품명이 짧아요' : null,
      product.description.length < 20 ? '상세 설명이 부족해요' : null,
      !product.image ? '이미지가 없어요' : null,
      product.price <= 0 ? '가격을 확인해주세요' : null,
      product.stock <= 0 ? '품절 상태예요' : null,
      !product.badge ? '배지가 없어요' : null,
    ].filter(Boolean) as string[];

    return { product, issues: productIssues };
  });
  const needsWork = issues.filter((item) => item.issues.length > 0);

  return (
    <div className="px-5 pt-5">
      <div className="rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">CATALOG</p>
        <h1 className="mt-2 text-2xl font-black">상품 데이터 품질</h1>
        <p className="mt-2 text-[13px] leading-5 text-white/75">상품명, 설명, 이미지, 가격, 재고를 오픈 전 점검해요.</p>
      </div>

      <section className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-white p-3">
          <p className="text-lg font-black text-[#214b36]">{products.length}</p>
          <p className="mt-1 text-[11px] font-bold text-[#7a6b4d]">전체 상품</p>
        </div>
        <div className="rounded-2xl bg-white p-3">
          <p className="text-lg font-black text-[#214b36]">{needsWork.length}</p>
          <p className="mt-1 text-[11px] font-bold text-[#7a6b4d]">점검 필요</p>
        </div>
      </section>

      <div className="mt-5 space-y-3">
        {issues.map(({ product, issues: productIssues }) => (
          <Link key={product.id} href={`/admin/products?edit=${product.id}`} className="flex gap-3 rounded-3xl bg-white p-4 shadow-sm active:scale-[.99]">
            {product.image ? (
              <img src={product.image} alt={product.name} className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-[#e5f0dc] text-[#214b36]"><ImageIcon size={24} /></span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block font-black text-[#1f2a24]">{product.name}</span>
              <span className="mt-1 block text-xs font-bold text-[#7a6b4d]">{product.category} · 재고 {product.stock}</span>
              <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${productIssues.length ? 'bg-red-50 text-red-600' : 'bg-[#e5f0dc] text-[#214b36]'}`}>
                {productIssues.length ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
                {productIssues.length ? `${productIssues.length}개 점검` : '좋아요'}
              </span>
              {productIssues.length > 0 && <span className="mt-2 block text-xs leading-5 text-[#7a6b4d]">{productIssues.join(' · ')}</span>}
            </span>
            <ChevronRight size={18} className="mt-5 shrink-0 text-[#7a6b4d]" />
          </Link>
        ))}
      </div>
    </div>
  );
}
