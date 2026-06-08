export function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function detectOperator(noHp: string): string {
  const clean = noHp.replace(/\D/g, '')
  const prefix = clean.substring(0, 4)
  const telkomsel = ['0811','0812','0813','0821','0822','0823','0851','0852','0853']
  const xl = ['0817','0818','0819','0859','0877','0878']
  const indosat = ['0814','0815','0816','0855','0856','0857','0858']
  const tri = ['0895','0896','0897','0898','0899']
  const smartfren = ['0881','0882','0883','0884','0885','0886','0887','0888','0889']
  if (telkomsel.includes(prefix)) return 'Telkomsel'
  if (xl.includes(prefix)) return 'XL'
  if (indosat.includes(prefix)) return 'Indosat'
  if (tri.includes(prefix)) return 'Tri'
  if (smartfren.includes(prefix)) return 'Smartfren'
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
