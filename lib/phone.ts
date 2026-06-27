export function normalizeIndonesianPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('62')) return digits
  if (digits.startsWith('8')) return `62${digits}`
  return digits
}

export function isValidIndonesianPhone(value: string) {
  return /^628[0-9]{7,12}$/.test(normalizeIndonesianPhone(value))
}
