import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: String(email || '').trim() } });
  if (!user) return NextResponse.json({ message: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });

  const ok = await bcrypt.compare(String(password || ''), user.password);
  if (!ok) return NextResponse.json({ message: '이메일 또는 비밀번호가 맞지 않아요.' }, { status: 401 });

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  res.cookies.set('imf_user_id', user.id, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  return res;
}
