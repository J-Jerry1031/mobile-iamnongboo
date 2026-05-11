import type { Metadata } from 'next';
import './globals.css';
import { MobileHeader } from '@/components/MobileHeader';
import { BottomNav } from '@/components/BottomNav';
import { MobileFooter } from '@/components/MobileFooter';
import { FullMenuDrawer } from '@/components/FullMenuDrawer';
import { AuthCartReset } from '@/components/AuthCartReset';
import { getCurrentUser } from '@/lib/auth-lite';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: '아이엠농부',
  description: '산지직송 신선함을 담은 동네 프리미엄 마켓',
  openGraph: {
    title: '아이엠농부',
    description: '산지직송 신선함을 담은 동네 프리미엄 마켓',
    siteName: '아이엠농부',
    locale: 'ko_KR',
    type: 'website',
    images: [{ url: '/story/organic.jpg', width: 1200, height: 630, alt: '아이엠농부 신선 마켓' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '아이엠농부',
    description: '산지직송 신선함을 담은 동네 프리미엄 마켓',
    images: ['/story/organic.jpg'],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="ko">
      <body>
        <div className="mobile-shell">
          <AuthCartReset isAuthenticated={Boolean(user)} />
          <MobileHeader />
          <main className="pb-24">
            {children}
            <MobileFooter />
          </main>
          <BottomNav />
          <FullMenuDrawer isAdmin={user?.role === 'ADMIN'} />
        </div>
      </body>
    </html>
  );
}
