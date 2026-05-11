const CUID_PATTERN = /^[a-z0-9]{12,32}$/i;
const TOSS_ORDER_ID_PATTERN = /^[A-Z0-9_-]{8,80}$/;

export const productCategories = ['유기농', '과일', '채소', '수산물', '간식', '유제품', '음료', '반찬', '생활용품'] as const;
export const productSorts = ['new', 'price-low', 'price-high'] as const;
export const orderStatuses = [
  'READY',
  'PAID',
  'PREPARING',
  'READY_FOR_PICKUP',
  'SHIPPING',
  'COMPLETED',
  'CANCEL_REQUESTED',
  'CANCELED',
  'RETURN_REQUESTED',
  'RETURNED',
] as const;

export type ProductCategory = (typeof productCategories)[number];
export type ProductSort = (typeof productSorts)[number];
export type SafeOrderStatus = (typeof orderStatuses)[number];

export function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function safeText(value: unknown, maxLength = 200) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function safeOptionalText(value: unknown, maxLength = 200) {
  const text = safeText(value, maxLength);
  return text || null;
}

export function safeCuid(value: unknown) {
  const id = safeText(value, 40);
  return CUID_PATTERN.test(id) ? id : '';
}

export function safeTossOrderId(value: unknown) {
  const id = safeText(value, 100);
  return TOSS_ORDER_ID_PATTERN.test(id) ? id : '';
}

export function safeProductCategory(value: unknown) {
  const category = safeText(value, 20);
  return productCategories.includes(category as ProductCategory) ? category as ProductCategory : '';
}

export function safeProductSort(value: unknown) {
  const sort = safeText(value, 20);
  return productSorts.includes(sort as ProductSort) ? sort as ProductSort : 'new';
}

export function safeOrderStatus(value: unknown) {
  const status = safeText(value, 40);
  return orderStatuses.includes(status as SafeOrderStatus) ? status as SafeOrderStatus : '';
}

export function safeInt(value: unknown, fallback = 0, min = 0, max = 999_999_999) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return fallback;
  return number;
}

export function safeUrl(value: unknown, fallback: string) {
  const url = safeText(value, 500);
  if (!url) return fallback;

  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) ? url : fallback;
  } catch {
    return fallback;
  }
}
