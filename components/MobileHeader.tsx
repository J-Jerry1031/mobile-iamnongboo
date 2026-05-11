import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { HeaderCartButton } from '@/components/HeaderCartButton';

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white">
      <div className="relative mx-auto flex h-[92px] max-w-[430px] items-center justify-center px-6">
        <Link
          href="/"
          className="iam-farmer-logo"
          aria-label="IAM FARMER 홈"
          style={{ width: 92, height: 41, overflow: 'hidden' }}
        >
          <img
            src="/iam-farmer-logo.svg"
            alt="IAM FARMER"
            width={92}
            height={41}
            style={{ width: 92, height: 41, display: 'block' }}
          />
        </Link>

        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center gap-2">
          <HeaderCartButton />
          <Link href="/mypage" className="header-icon-button" aria-label="마이페이지">
            <UserRound size={20} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </header>
  );
}
