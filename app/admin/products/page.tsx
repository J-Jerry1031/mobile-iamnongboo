import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AdminProductCreateForm } from '@/components/AdminProductCreateForm';
import { AdminProductEditForm } from '@/components/AdminProductEditForm';
import { ProductToggleButton } from '@/components/ProductToggleButton';
import { BadgeCheck, PackageX } from 'lucide-react';
export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect('/login?next=/admin/products&reason=protected');

  const products = await prisma.product.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] });
  const soldOutCount = products.filter((product) => product.stock <= 0).length;
  const activeCount = products.filter((product) => product.isActive).length;

  return (
    <div className="px-5 pt-5">
      <div className="mb-5 rounded-[24px] bg-[#214b36] p-5 text-white">
        <p className="text-[12px] font-bold text-[#f5d87a]">ADMIN PRODUCTS</p>
        <h1 className="mt-2 text-2xl font-black">상품관리</h1>
        <p className="mt-2 text-[13px] text-white/75">상품 등록, 재고, 판매 상태를 관리해요.</p>
      </div>

      <section className="mb-5 grid grid-cols-3 gap-2 text-center">
        {[
          ['전체', products.length],
          ['판매중', activeCount],
          ['품절', soldOutCount],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-3">
            <p className="text-lg font-black text-[#214b36]">{value}</p>
            <p className="mt-1 text-[11px] font-bold text-[#7a6b4d]">{label}</p>
          </div>
        ))}
      </section>

      <AdminProductCreateForm />

      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-3xl bg-white p-4 text-sm shadow-sm">
            <div className="flex gap-3">
              <img src={product.image} alt={product.name} className="h-20 w-20 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1">
                  <span className="rounded-full bg-[#e5f0dc] px-2 py-1 text-[10px] font-black text-[#214b36]">
                    {product.isActive ? '판매중' : '숨김'}
                  </span>
                  {product.stock <= 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">
                      <PackageX size={12} /> 품절
                    </span>
                  )}
                  {product.isFarmerPick && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff4bf] px-2 py-1 text-[10px] font-black text-[#214b36]">
                      <BadgeCheck size={12} /> 추천
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-1 font-black text-[#1f2a24]">{product.name}</p>
                <p className="mt-1 text-xs font-bold text-[#7a6b4d]">{product.category} / 재고 {product.stock}</p>
                <p className="mt-1 text-base font-black text-[#214b36]">{won(product.price)}</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <ProductToggleButton productId={product.id} isActive={product.isActive} />
            </div>
            <AdminProductEditForm product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
