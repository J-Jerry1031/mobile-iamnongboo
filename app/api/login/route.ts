import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setAuthCookies } from '@/lib/auth-lite';
import { rateLimit } from '@/lib/rate-limit';
import { asRecord, safeText } from '@/lib/security';

export async function POST(req: Request) {
  const limited = await rateLimit('login', 8, 60_000);
  if (limited) return limited;

  const body = asRecord(await req.json());
  const email = safeText(body.email, 254).toLowerCase();
  const password = String(body.password || '').slice(0, 200);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ message: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return NextResponse.json({ message: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  setAuthCookies(res, user.id);
  return res;
}
