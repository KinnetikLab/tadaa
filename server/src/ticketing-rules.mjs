export const CLIP_CHECKOUT_PAID_STATUS = 'CHECKOUT_COMPLETED';
export function isClipCheckoutPaid(status) {
  return String(status || '').toUpperCase() === CLIP_CHECKOUT_PAID_STATUS;
}
export function clampMembershipPromoDays(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(1, Math.min(90, Math.trunc(n))) : 30;
}
export function validSeatSelection(seatIds, quantity, isUuid) {
  return Array.isArray(seatIds) &&
    seatIds.length === quantity &&
    new Set(seatIds).size === seatIds.length &&
    seatIds.every(id => isUuid(id));
}
export function clipAmountFromMinor(amountMinor) {
  const amount = Number(amountMinor);
  if (!Number.isSafeInteger(amount) || amount < 100) {
    throw new Error('Clip Checkout requiere un monto mínimo de $1.00 MXN.');
  }
  return (amount / 100).toFixed(2);
}
