import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setAuthCookies } from '@/lib/auth-lite';

export async function POST(req: Request) {
  const { name, email, phone, password, zonecode, address, addressDetail } = await req.json();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').replaceAll('-', '').replaceAll(' ', '');
  const rawPassword = String(password || '');
  const trimmedName = String(name || '').trim();
  const trimmedAddress = String(address || '').trim();
  const trimmedZonecode = String(zonecode || '').trim();
  const trimmedAddressDetail = String(addressDetail || '').trim();

  if (!trimmedName) {
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
  if (trimmedAddress && !normalizedPhone) {
    return NextResponse.json({ message: '기본 배송지를 등록하려면 연락처를 입력해주세요.' }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) {
    return NextResponse.json({ message: '이미 가입된 이메일입니다.' }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(rawPassword, 12);
  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        phone: normalizedPhone || null,
        password: hashedPassword,
        role: 'USER',
      },
    });

    if (trimmedAddress) {
      await tx.deliveryAddress.create({
        data: {
          userId: createdUser.id,
          label: '기본 배송지',
          recipient: trimmedName,
          phone: normalizedPhone,
          zonecode: trimmedZonecode || null,
          address: trimmedAddress,
          detail: trimmedAddressDetail || null,
          isDefault: true,
        },
      });
    }

    return createdUser;
  });

  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  setAuthCookies(res, user.id);
  return res;
}
