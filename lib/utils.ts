export function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

const OPERATOR_PREFIXES: Record<string, string> = {
  '0811': 'TELKOMSEL',
  '0812': 'TELKOMSEL',
  '0813': 'TELKOMSEL',
  '0821': 'TELKOMSEL',
  '0822': 'TELKOMSEL',
  '0823': 'TELKOMSEL',
  '0851': 'TELKOMSEL',
  '0852': 'TELKOMSEL',
  '0853': 'TELKOMSEL',
  '0814': 'INDOSAT',
  '0815': 'INDOSAT',
  '0816': 'INDOSAT',
  '0855': 'INDOSAT',
  '0856': 'INDOSAT',
  '0857': 'INDOSAT',
  '0858': 'INDOSAT',
  '0817': 'XL',
  '0818': 'XL',
  '0819': 'XL',
  '0859': 'XL',
  '0877': 'XL',
  '0878': 'XL',
  '0879': 'XL',
  '0831': 'AXIS',
  '0832': 'AXIS',
  '0833': 'AXIS',
  '0838': 'AXIS',
  '0895': 'TRI',
  '0896': 'TRI',
  '0897': 'TRI',
  '0898': 'TRI',
  '0899': 'TRI',
  '0881': 'SMARTFREN',
  '0882': 'SMARTFREN',
  '0883': 'SMARTFREN',
  '0884': 'SMARTFREN',
  '0885': 'SMARTFREN',
  '0886': 'SMARTFREN',
  '0887': 'SMARTFREN',
  '0888': 'SMARTFREN',
  '0889': 'SMARTFREN',
}

const OPERATOR_LABELS: Record<string, string> = {
  TELKOMSEL: 'Telkomsel',
  INDOSAT: 'Indosat',
  XL: 'XL',
  AXIS: 'Axis',
  TRI: 'Tri',
  SMARTFREN: 'Smartfren',
}

function normalizePhonePrefix(noHp: string) {
  const clean = noHp.replace(/\D/g, '')
  const local = clean.startsWith('62') ? `0${clean.slice(2)}` : clean
  return local.substring(0, 4)
}

export function detectBrand(noHp: string): string | null {
  const prefix = normalizePhonePrefix(noHp)
  return OPERATOR_PREFIXES[prefix] || null
}

export function detectOperator(noHp: string): string {
  const brand = detectBrand(noHp)
  if (brand) return OPERATOR_LABELS[brand] || brand
  return 'Unknown'
}

export function operatorColor(op: string) {
  const map: Record<string, string> = {
    Telkomsel: 'bg-red-500',
    XL: 'bg-blue-500',
    Indosat: 'bg-yellow-500',
    Tri: 'bg-purple-500',
    Smartfren: 'bg-pink-500',
  }
  return map[op] ?? 'bg-gray-500'
}
