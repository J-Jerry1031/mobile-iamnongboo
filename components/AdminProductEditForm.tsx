'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { won } from '@/lib/format';

type AdminProduct = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  detailImage: string | null;
  origin: string | null;
  weight: string | null;
  storage: string | null;
  expiration: string | null;
  allergy: string | null;
  badge: string | null;
  stock: number;
  isActive: boolean;
  isFarmerPick: boolean;
  sortOrder: number;
};

const categories = ['유기농', '과일', '채소', '수산물', '간식', '유제품', '음료', '반찬', '생활용품'];

export function AdminProductEditForm({ product }: { product: AdminProduct }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('edit') === product.id) queueMicrotask(() => setOpen(true));
  }, [product.id, searchParams]);

  async function submit(formData: FormData) {
    const payload = Object.fromEntries(formData);
    payload.productId = product.id;
    payload.isFarmerPick = payload.isFarmerPick === 'true' ? 'true' : '';

    const res = await fetch('/api/admin/products/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.message || '상품 수정 실패');
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-2xl bg-[#214b36] px-4 py-2 text-xs font-black text-white"
      >
        {open ? '수정 닫기' : '상품 수정'}
      </button>

      {open && (
        <form action={submit} className="mt-3 space-y-2 rounded-2xl bg-[#fcfbf6] p-3">
          <input name="name" defaultValue={product.name} className="w-full rounded-xl bg-white p-3 text-sm" />
          <select name="category" defaultValue={product.category} className="w-full rounded-xl bg-white p-3 text-sm">
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input name="price" type="number" defaultValue={product.price} className="w-full rounded-xl bg-white p-3 text-sm" />
            <input name="stock" type="number" defaultValue={product.stock} className="w-full rounded-xl bg-white p-3 text-sm" />
          </div>
          <input name="badge" defaultValue={product.badge || ''} placeholder="뱃지" className="w-full rounded-xl bg-white p-3 text-sm" />
          <input name="sortOrder" type="number" defaultValue={product.sortOrder} placeholder="정렬 순서" className="w-full rounded-xl bg-white p-3 text-sm" />
          <input name="image" defaultValue={product.image} placeholder="이미지 URL" className="w-full rounded-xl bg-white p-3 text-sm" />
          <input name="detailImage" defaultValue={product.detailImage || ''} placeholder="상세 이미지 URL" className="w-full rounded-xl bg-white p-3 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input name="origin" defaultValue={product.origin || ''} placeholder="원산지" className="min-w-0 rounded-xl bg-white p-3 text-sm" />
            <input name="weight" defaultValue={product.weight || ''} placeholder="중량/용량" className="min-w-0 rounded-xl bg-white p-3 text-sm" />
            <input name="storage" defaultValue={product.storage || ''} placeholder="보관방법" className="min-w-0 rounded-xl bg-white p-3 text-sm" />
            <input name="expiration" defaultValue={product.expiration || ''} placeholder="소비기한" className="min-w-0 rounded-xl bg-white p-3 text-sm" />
          </div>
          <input name="allergy" defaultValue={product.allergy || ''} placeholder="알레르기/주의사항" className="w-full rounded-xl bg-white p-3 text-sm" />
          <textarea name="description" defaultValue={product.description} className="min-h-24 w-full rounded-xl bg-white p-3 text-sm" />
          <label className="flex items-center gap-2 text-sm font-black text-[#214b36]">
            <input name="isFarmerPick" type="checkbox" value="true" defaultChecked={product.isFarmerPick} className="h-4 w-4 accent-[#214b36]" />
            추천상품
          </label>
          <button className="w-full rounded-xl bg-[#f5d87a] py-3 text-sm font-black text-[#214b36]">
            {won(product.price)} 상품 저장
          </button>
        </form>
      )}
    </div>
  );
}
