import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { asRecord, safeCuid } from '@/lib/security';

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: '관리자만 가능합니다.' }, { status: 403 });
  const body = asRecord(await req.json());
  const productId = safeCuid(body.productId);
  if (!productId) return NextResponse.json({ message: '상품 ID가 필요해요.' }, { status: 400 });

  const product = await prisma.product.update({ where: { id: productId }, data: { isActive: Boolean(body.isActive) } });
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
