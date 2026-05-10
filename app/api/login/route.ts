import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setAuthCookies } from '@/lib/auth-lite';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: String(email || '').trim().toLowerCase() } });
  if (!user) return NextResponse.json({ message: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });

  const ok = await bcrypt.compare(String(password || ''), user.password);
  if (!ok) return NextResponse.json({ message: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  setAuthCookies(res, user.id);
  return res;
}
