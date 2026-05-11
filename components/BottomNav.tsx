'use client';

import Link from 'next/link';
import { Home, Leaf, Heart } from 'lucide-react';
import { FullMenuButton } from '@/components/FullMenuDrawer';
import { usePathname } from 'next/navigation';

export function BottomNav() {
  const pathname = usePathname();
  const item = 'flex flex-col items-center gap-1 text-[13px] transition-colors';
  const activeText = 'font-black text-[#111]';
  const inactiveText = 'font-medium text-[#111]';
  const isHome = pathname === '/';
  const isProducts = pathname.startsWith('/products');
  const isStory = pathname.startsWith('/inquiries');

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-4 border-t border-[#e8e8e8] bg-white px-4 pb-4 pt-3 safe-bottom">
      <Link className={`${item} ${isHome ? activeText : inactiveText}`} href="/" aria-current={isHome ? 'page' : undefined}>
        <Home size={29} strokeWidth={1.7} fill={isHome ? '#f1ead9' : 'none'} />
        홈
      </Link>

      <Link className={`${item} ${isProducts ? activeText : inactiveText}`} href="/products/market" aria-current={isProducts ? 'page' : undefined}>
        <Leaf size={29} strokeWidth={1.7} fill={isProducts ? '#8fb894' : 'none'} />
        농산물
      </Link>

      <Link className={`${item} ${isStory ? activeText : inactiveText}`} href="/inquiries" aria-current={isStory ? 'page' : undefined}>
        <Heart size={29} strokeWidth={1.7} fill={isStory ? '#f29aa0' : 'none'} />
        이야기
      </Link>

      <FullMenuButton />
    </nav>
  );
}
