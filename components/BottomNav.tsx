import Link from 'next/link';
import { Home, Leaf, Heart, UserRound } from 'lucide-react';

export function BottomNav() {
  const item =
    'flex flex-col items-center gap-1 text-[13px] font-medium text-[#111]';

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-4 border-t border-[#e8e8e8] bg-white px-4 pb-4 pt-3 safe-bottom">
      <Link className={item} href="/">
        <Home size={29} strokeWidth={1.7} />
        홈
      </Link>

      <Link className={item} href="/products/market">
        <Leaf size={29} strokeWidth={1.7} />
        농산물
      </Link>

      <Link className={item} href="/inquiries">
        <Heart size={29} strokeWidth={1.7} />
        이야기
      </Link>

      <Link className={item} href="/mypage">
        <UserRound size={29} strokeWidth={1.7} />
        마이페이지
      </Link>
    </nav>
  );
}