import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = { page: number; pageSize: number; totalRows: number; path: string; query?: string; params?: Record<string, string> }

export default function DataTablePagination({ page, pageSize, totalRows, path, query = '', params: extraParams = {} }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalRows)
  const href = (nextPage: number, nextSize = pageSize) => {
    const params = new URLSearchParams()
    Object.entries(extraParams).forEach(([key, value]) => value && params.set(key, value))
    if (query) params.set('q', query)
    params.set('page', String(nextPage))
    params.set('perPage', String(nextSize))
    return `${path}?${params}`
  }

  return (
    <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <p>Menampilkan {from.toLocaleString('id-ID')}–{to.toLocaleString('id-ID')} dari {totalRows.toLocaleString('id-ID')} row</p>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs">Row:</span>
        {[25, 50, 100].map((size) => <Link key={size} href={href(1, size)} className={`rounded-lg px-2.5 py-1.5 text-xs ${pageSize === size ? 'bg-violet-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}>{size}</Link>)}
        <Link href={href(Math.max(1, page - 1))} aria-disabled={page <= 1} className={`rounded-lg border border-white/10 p-1.5 ${page <= 1 ? 'pointer-events-none opacity-30' : 'hover:bg-white/10'}`}><ChevronLeft size={16} /></Link>
        <span className="min-w-20 text-center text-xs">{page} / {totalPages}</span>
        <Link href={href(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages} className={`rounded-lg border border-white/10 p-1.5 ${page >= totalPages ? 'pointer-events-none opacity-30' : 'hover:bg-white/10'}`}><ChevronRight size={16} /></Link>
      </div>
    </div>
  )
}
