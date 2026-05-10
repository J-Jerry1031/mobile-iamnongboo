export const orderStatusLabel = {
  READY: '결제대기',
  PAID: '결제완료',
  PREPARING: '상품준비중',
  READY_FOR_PICKUP: '픽업준비완료',
  SHIPPING: '배송중',
  COMPLETED: '수령/배송완료',
  CANCEL_REQUESTED: '취소요청',
  CANCELED: '취소완료',
  RETURN_REQUESTED: '반품요청',
  RETURNED: '반품완료',
} as const;

export const stockHeldStatuses = ['PAID', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPING', 'COMPLETED', 'CANCEL_REQUESTED', 'RETURN_REQUESTED'];
export const reviewableStatuses = ['PAID', 'PREPARING', 'READY_FOR_PICKUP', 'SHIPPING', 'COMPLETED', 'RETURN_REQUESTED', 'RETURNED'];
