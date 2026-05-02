import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

  const { orderId, status } = await req.json();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ message: '주문을 찾을 수 없어요.' }, { status: 404 });

  const isAdmin = user.role === 'ADMIN';
  const isOwner = order.userId === user.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ message: '권한이 없어요.' }, { status: 403 });

  const updated = await prisma.order.update({ where: { id: orderId }, data: { status } });
  return NextResponse.json(updated);
}
