import { formatPhone, normalizePhone } from '@/lib/phone';

export function maskName(value?: string | null) {
  const text = String(value || '').trim();
  if (!text) return '미등록';
  if (text.length <= 1) return text;
  if (text.length === 2) return `${text[0]}*`;
  return `${text[0]}${'*'.repeat(text.length - 2)}${text.at(-1)}`;
}

export function maskEmail(value?: string | null) {
  const text = String(value || '').trim();
  const [local, domain] = text.split('@');
  if (!local || !domain) return text || '미등록';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}

export function maskPhone(value?: string | null) {
  const digits = normalizePhone(value);
  if (!digits) return '연락처 미등록';
  if (digits.length < 7) return formatPhone(digits);
  return formatPhone(`${digits.slice(0, 3)}****${digits.slice(-4)}`);
}

export function maskAddress(value?: string | null) {
  const text = String(value || '').trim();
  if (!text) return '';
  const [base] = text.split(/,\s*|\s+\d{1,5}동|\s+\d{1,5}호/);
  return `${base.slice(0, 32)}${base.length > 32 ? '...' : ''} / 상세주소 보호`;
}
