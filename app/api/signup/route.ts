import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { name, email, phone, password } = await req.json();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').replaceAll('-', '').replaceAll(' ', '');
  const rawPassword = String(password || '');

  if (!String(name || '').trim()) {
    return NextResponse.json({ message: '이름을 입력해주세요.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return NextResponse.json({ message: '이메일을 정확히 입력해주세요.' }, { status: 400 });
  }
  if (normalizedPhone && !/^01\d{8,9}$/.test(normalizedPhone)) {
    return NextResponse.json({ message: '연락처를 정확히 입력해주세요.' }, { status: 400 });
  }
  if (rawPassword.length < 8) {
    return NextResponse.json({ message: '비밀번호는 8자 이상 입력해주세요.' }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) {
    return NextResponse.json({ message: '이미 가입된 이메일입니다.' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(rawPassword, 12);
  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      phone: normalizedPhone || null,
      password: hashedPassword,
      role: 'USER',
    },
  });

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  res.cookies.set('imf_user_id', user.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
