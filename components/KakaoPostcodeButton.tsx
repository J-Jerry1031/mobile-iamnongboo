'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

type PostcodeData = {
  zonecode: string;
  address: string;
  roadAddress: string;
  jibunAddress: string;
};

declare global {
  interface Window {
    kakao?: {
      Postcode: new (options: { oncomplete: (data: PostcodeData) => void }) => { open: () => void };
    };
    daum?: {
      Postcode: new (options: { oncomplete: (data: PostcodeData) => void }) => { open: () => void };
    };
  }
}

function loadPostcodeScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.kakao?.Postcode || window.daum?.Postcode) return resolve();
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-postcode]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.dataset.kakaoPostcode = 'true';
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function KakaoPostcodeButton({
  onSelect,
  className = '',
}: {
  onSelect: (data: { zonecode: string; address: string }) => void;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function openPostcode() {
    try {
      setLoading(true);
      await loadPostcodeScript();
      setLoading(false);
      const Postcode = window.kakao?.Postcode || window.daum?.Postcode;
      if (!Postcode) throw new Error('Kakao Postcode is unavailable');
      new Postcode({
        oncomplete(data) {
          onSelect({
            zonecode: data.zonecode,
            address: data.roadAddress || data.address || data.jibunAddress,
          });
        },
      }).open();
    } catch {
      setLoading(false);
      alert('주소 검색을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  }

  return (
    <button
      type="button"
      onClick={openPostcode}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#214b36] px-4 py-3 text-sm font-black text-white ${className}`}
    >
      <Search size={16} /> {loading ? '불러오는 중...' : '주소 검색'}
    </button>
  );
}
