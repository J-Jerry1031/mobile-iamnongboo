'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-client';

export function AdminProductCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  async function uploadImage(file: File) {
    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabaseBrowser.storage
      .from('products')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      alert(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabaseBrowser.storage
      .from('products')
      .getPublicUrl(path);

    setImageUrl(data.publicUrl);
    setUploading(false);
  }

  async function submit(formData: FormData) {
    const payload = Object.fromEntries(formData);
    payload.image = imageUrl || String(payload.image || '');

    const res = await fetch('/api/admin/products/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.message || '상품 등록 실패');
      return;
    }

    setImageUrl('');
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mb-5 rounded-3xl bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-2xl bg-[#214b36] py-3 font-black text-white"
      >
        상품 등록하기
      </button>

      {open && (
        <form action={submit} className="mt-4 space-y-3">
          <input name="name" placeholder="상품명" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <select name="category" className="w-full rounded-2xl bg-[#fffaf0] p-4">
            {['유기농', '과일', '채소', '수산물', '간식', '유제품', '음료', '반찬', '생활용품'].map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <input name="price" type="number" placeholder="판매가" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input name="stock" type="number" placeholder="재고" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input name="badge" placeholder="뱃지 예: 산지직송" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <input name="sortOrder" type="number" placeholder="정렬 순서" className="w-full rounded-2xl bg-[#fffaf0] p-4" />
          <label className="flex items-center gap-2 rounded-2xl bg-[#fffaf0] p-4 text-sm font-black text-[#214b36]">
            <input name="isFarmerPick" type="checkbox" value="true" className="h-4 w-4 accent-[#214b36]" />
            추천상품으로 표시
          </label>

          <div className="rounded-2xl bg-[#fffaf0] p-4">
            <p className="mb-2 text-sm font-black text-[#214b36]">상품 사진 업로드</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />
            {uploading && <p className="mt-2 text-sm text-[#7a6b4d]">업로드 중...</p>}
            {imageUrl && (
              <img src={imageUrl} alt="업로드 이미지" className="mt-3 aspect-square w-full rounded-2xl object-cover" />
            )}
          </div>

          <input
            name="image"
            placeholder="이미지 URL 직접 입력도 가능"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-2xl bg-[#fffaf0] p-4"
          />

          <input name="detailImage" placeholder="상세 이미지 URL" className="w-full rounded-2xl bg-[#fffaf0] p-4" />

          <div className="grid grid-cols-2 gap-2">
            <input name="origin" placeholder="원산지" className="min-w-0 rounded-2xl bg-[#fffaf0] p-4" />
            <input name="weight" placeholder="중량/용량" className="min-w-0 rounded-2xl bg-[#fffaf0] p-4" />
            <input name="storage" placeholder="보관방법" className="min-w-0 rounded-2xl bg-[#fffaf0] p-4" />
            <input name="expiration" placeholder="소비기한" className="min-w-0 rounded-2xl bg-[#fffaf0] p-4" />
          </div>

          <input name="allergy" placeholder="알레르기/주의사항" className="w-full rounded-2xl bg-[#fffaf0] p-4" />

          <textarea name="description" placeholder="상품 설명" className="min-h-28 w-full rounded-2xl bg-[#fffaf0] p-4" />

          <button className="w-full rounded-2xl bg-[#f5d87a] py-3 font-black text-[#214b36]">
            저장
          </button>
        </form>
      )}
    </div>
  );
}
