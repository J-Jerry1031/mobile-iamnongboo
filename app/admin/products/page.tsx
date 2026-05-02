import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { won } from '@/lib/format';
import { AdminProductCreateForm } from '@/components/AdminProductCreateForm';
import { ProductToggleButton } from '@/components/ProductToggleButton';
export const dynamic = 'force-dynamic';
export default async function AdminProductsPage() { const admin = await requireAdmin(); if (!admin) redirect('/login'); const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } }); return <div className="px-5 pt-5"><h1 className="mb-5 text-2xl font-black text-[#214b36]">상품관리</h1><AdminProductCreateForm /><div className="space-y-3">{products.map((p) => <div key={p.id} className="rounded-3xl bg-white p-4 text-sm"><div className="flex gap-3"><img src={p.image} alt={p.name} className="h-16 w-16 rounded-2xl object-cover" /><div><p className="font-black">{p.name}</p><p>{p.category} / {won(p.price)} / 재고 {p.stock}</p><p className="mt-1 text-xs text-[#7a6b4d]">{p.isActive ? '판매중' : '숨김'}</p></div></div><ProductToggleButton productId={p.id} isActive={p.isActive} /></div>)}</div></div>; }
