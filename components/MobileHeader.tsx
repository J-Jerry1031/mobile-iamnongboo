import Link from 'next/link';
import { ShoppingBag, UserRound } from 'lucide-react';

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="relative mx-auto flex h-[92px] max-w-[430px] items-center justify-center px-6">
        <Link href="/" className="iam-farmer-logo" aria-label="IAM FARMER 홈">
          <span>IAM</span>
          <strong>FARMER</strong>
        </Link>

        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <Link href="/cart" className="header-icon-button" aria-label="장바구니">
            <ShoppingBag size={20} strokeWidth={1.8} />
          </Link>
          <Link href="/mypage" className="header-icon-button" aria-label="마이페이지">
            <UserRound size={20} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </header>
  );
}
