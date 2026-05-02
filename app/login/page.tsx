import { Suspense } from 'react';
import { LoginClient } from '@/components/login/LoginClient';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-5 pt-8">로그인 불러오는 중...</div>}>
      <LoginClient />
    </Suspense>
  );
}
