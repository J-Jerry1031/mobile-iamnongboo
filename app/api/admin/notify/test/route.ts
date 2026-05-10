import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { notifyAdmin } from '@/lib/notify';

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });

  if (!process.env.ADMIN_NOTIFY_WEBHOOK_URL) {
    return NextResponse.json({ message: 'ADMIN_NOTIFY_WEBHOOK_URL이 설정되지 않았어요.' }, { status: 400 });
  }

  await notifyAdmin({
    title: '아이엠농부 알림 테스트',
    body: `${admin.name} 관리자가 Slack Webhook 연결을 테스트했습니다.`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin/system`,
  });

  return NextResponse.json({ ok: true });
}
