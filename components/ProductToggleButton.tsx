'use client';
import { useRouter } from 'next/navigation';
export function ProductToggleButton({ productId, isActive }: { productId: string; isActive: boolean }) { const router = useRouter(); return <button onClick={async () => { await fetch('/api/admin/products/toggle', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, isActive: !isActive }) }); router.refresh(); }} className="mt-3 rounded-2xl bg-[#f1ead9] px-4 py-2 text-xs font-black text-[#214b36]">{isActive ? '판매 숨김' : '판매 재개'}</button>; }
