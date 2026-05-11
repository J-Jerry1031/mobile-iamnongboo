import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { notifyAdmin } from '@/lib/notify';

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });

  const provider = (process.env.ADMIN_NOTIFY_PROVIDER || 'slack').toLowerCase();
  const configured =
    provider === 'telegram'
      ? process.env.ADMIN_NOTIFY_TELEGRAM_BOT_TOKEN && process.env.ADMIN_NOTIFY_TELEGRAM_CHAT_ID
      : provider === 'ntfy'
        ? process.env.ADMIN_NOTIFY_NTFY_TOPIC
        : process.env.ADMIN_NOTIFY_WEBHOOK_URL;

  if (!configured) {
    return NextResponse.json({ message: `${provider} 알림 환경변수가 설정되지 않았어요.` }, { status: 400 });
  }

  await notifyAdmin({
    title: '아이엠농부 알림 테스트',
    body: `${admin.name} 관리자가 ${provider} 알림 연결을 테스트했습니다.`,
    url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/admin/system`,
  });

  return NextResponse.json({ ok: true });
}
