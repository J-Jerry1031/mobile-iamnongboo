import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });
  const { productId, isActive } = await req.json();
  const product = await prisma.product.update({ where: { id: productId }, data: { isActive } });
  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.id,
      action: 'PRODUCT_TOGGLE',
      targetType: 'PRODUCT',
      targetId: product.id,
      summary: `${product.name} 판매 상태 ${product.isActive ? '판매중' : '숨김'} 변경`,
    },
  });
  return NextResponse.json(product);
}
