'use client';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-store';
import { markAnonymousCartState } from '@/components/AuthCartReset';

export function LogoutButton() {
  const router = useRouter();
  const clear = useCart((state) => state.clear);

  return (
    <button
      onClick={async () => {
        await fetch('/api/logout', { method: 'POST' });
        clear();
        markAnonymousCartState();
        router.push('/');
        router.refresh();
      }}
      className="mt-5 w-full rounded-2xl bg-[#f1ead9] py-4 font-bold"
    >
      로그아웃
    </button>
  );
}
