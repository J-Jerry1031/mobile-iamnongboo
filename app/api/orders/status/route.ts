import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-lite';
import { prisma } from '@/lib/prisma';
import { stockHeldStatuses } from '@/lib/order-status';
import { asRecord, safeCuid, safeOrderStatus } from '@/lib/security';

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: '로그인이 필요해요.' }, { status: 401 });

  const body = asRecord(await req.json());
  const orderId = safeCuid(body.orderId);
  const status = safeOrderStatus(body.status);
  if (!orderId) return NextResponse.json({ message: '주문 ID가 필요해요.' }, { status: 400 });
  if (!status) {
    return NextResponse.json({ message: '변경할 수 없는 주문 상태입니다.' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return NextResponse.json({ message: '주문을 찾을 수 없어요.' }, { status: 404 });

  const isAdmin = user.role === 'ADMIN';
  const isOwner = order.userId === user.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ message: '권한이 없어요.' }, { status: 403 });

  if (!isAdmin && !['CANCEL_REQUESTED', 'RETURN_REQUESTED'].includes(status)) {
    return NextResponse.json({ message: '고객은 취소/반품 신청만 할 수 있어요.' }, { status: 403 });
  }

  const shouldDeductStock = isAdmin && stockHeldStatuses.includes(status) && !stockHeldStatuses.includes(order.status);
  const shouldRestoreStock = isAdmin && stockHeldStatuses.includes(order.status) && ['CANCELED', 'RETURNED'].includes(status);

  if (shouldDeductStock) {
    const products = await prisma.product.findMany({ where: { id: { in: order.items.map((item) => item.productId) } } });
    const productMap = new Map(products.map((product) => [product.id, product]));
    const insufficient = order.items.find((item) => (productMap.get(item.productId)?.stock ?? 0) < item.quantity);
    if (insufficient) {
      return NextResponse.json({ message: `${insufficient.name} 재고가 부족해 결제완료 처리할 수 없어요.` }, { status: 400 });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (shouldDeductStock) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    if (shouldRestoreStock) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    const updatedOrder = await tx.order.update({ where: { id: orderId }, data: { status } });
    if (isAdmin) {
      await tx.adminAuditLog.create({
        data: {
          adminId: user.id,
          action: 'ORDER_STATUS_UPDATE',
          targetType: 'ORDER',
          targetId: orderId,
          summary: `${order.orderNo} 상태 ${order.status} -> ${status}`,
        },
      });
    }
    return updatedOrder;
  });

  return NextResponse.json(updated);
}
