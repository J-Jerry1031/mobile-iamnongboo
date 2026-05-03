import Link from 'next/link';
import { ShoppingBag, UserRound } from 'lucide-react';

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#eadfc8] bg-[#fffaf0]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[430px] items-center justify-between px-4">
        <Link href="/" className="font-sans text-xl font-black tracking-tight text-[#214b36]">아이엠농부</Link>
        <nav className="flex items-center gap-3 text-[#214b36]">
          <Link href="/mypage"><UserRound size={22} /></Link>
          <Link href="/cart"><ShoppingBag size={23} /></Link>
        </nav>
      </div>
    </header>
  );
}
