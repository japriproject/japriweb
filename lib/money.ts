export function toInt(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? Math.trunc(value) : 0
  if (typeof value === 'bigint') return Number(value)
  if (typeof value !== 'string') return 0
  const parsed = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0
}

export function normalizePhone(value: string) {
  return value.replace(/\D/g, '')
}
