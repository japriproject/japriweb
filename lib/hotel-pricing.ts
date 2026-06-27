const configuredMarkup = Number(process.env.NEXT_PUBLIC_HOTEL_MARKUP_PERCENT ?? '3')

export const HOTEL_MARKUP_PERCENT =
  Number.isFinite(configuredMarkup) && configuredMarkup >= 0 && configuredMarkup <= 100
    ? configuredMarkup
    : 3

export function applyHotelMarkup(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return Math.ceil(amount * (1 + HOTEL_MARKUP_PERCENT / 100))
}
