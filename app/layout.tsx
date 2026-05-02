import type { Metadata } from 'next';
import './globals.css';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';

export const metadata: Metadata = {
  title: '아이엠농부',
  description: '산지직송 신선함을 담은 동네 프리미엄 마켓',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="mobile-shell">
          <MobileHeader />
          <main className="pb-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
