import { FileText, Search } from 'lucide-react'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import DataTablePagination from '../DataTablePagination'
import ProductActions from '../ProductActions'

export const dynamic = 'force-dynamic'

type ProductRow = {
  id: number
  code: string
  name: string
  kategori: string
  brand: string
  admin: number
  price: number
  sale: number
  status: string
}

export default async function AdminPascabayarPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; perPage?: string }> }) {
  await requireAdmin()
  const { q = '', page: rawPage = '1', perPage: rawPageSize = '25' } = await searchParams
  const search = q.trim().slice(0, 80)
  const pageSize = [25, 50, 100].includes(Number(rawPageSize)) ? Number(rawPageSize) : 25
  const requestedPage = Math.max(1, Number.parseInt(rawPage, 10) || 1)
  const where = search ? Prisma.sql`WHERE code LIKE ${`%${search}%`} OR name LIKE ${`%${search}%`} OR kategori LIKE ${`%${search}%`} OR brand LIKE ${`%${search}%`}` : Prisma.empty

  const [countRows, marginRows] = await Promise.all([
    prisma.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`SELECT COUNT(*) AS total FROM pasca ${where}`),
    prisma.$queryRaw<Array<{ margin: number }>>`SELECT COALESCE(MAX(GREATEST(sale - price, 0)), 0) AS margin FROM pasca`,
  ])
  const totalRows = Number(countRows[0]?.total ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const offset = (page - 1) * pageSize
  const products = await prisma.$queryRaw<ProductRow[]>(Prisma.sql`
    SELECT id, code, name, kategori, brand, admin, price, sale, status
    FROM pasca
    ${where}
    ORDER BY kategori ASC, brand ASC, name ASC
    LIMIT ${pageSize} OFFSET ${offset}
  `)

  return (
    <div className="mx-auto max-w-7xl p-5 sm:p-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-violet-400">Produk</p>
        <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold"><FileText className="text-slate-500" /> Produk pascabayar</h1>
        <p className="mt-2 text-sm text-slate-400">Kelola produk pascabayar, sinkron Digiflazz, dan margin admin.</p>
      </header>

      <div className="mb-5 grid items-start gap-4 lg:grid-cols-[minmax(280px,420px)_1fr]">
        <form className="flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 focus-within:border-violet-500">
          <Search size={17} className="text-slate-500" />
          <input name="q" defaultValue={search} placeholder="Cari kode, nama, kategori, brand" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
        </form>
        <ProductActions type="pascabayar" defaultMargin={Number(marginRows[0]?.margin ?? 0)} />
      </div>

      <div className="overflow-hidden rounded-t-2xl border border-white/10 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Kode</th><th className="px-5 py-3">Nama</th><th className="px-5 py-3">Kategori</th><th className="px-5 py-3">Brand</th><th className="px-5 py-3">Admin</th><th className="px-5 py-3">Jual</th><th className="px-5 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-4 font-mono text-xs">{product.code}</td>
                  <td className="px-5 py-4 font-medium">{product.name}</td>
                  <td className="px-5 py-4 text-slate-400">{product.kategori}</td>
                  <td className="px-5 py-4">{product.brand}</td>
                  <td className="px-5 py-4">{formatRupiah(product.admin)}</td>
                  <td className="px-5 py-4 font-semibold">{formatRupiah(product.sale)}</td>
                  <td className="px-5 py-4"><span className={product.status === '1' ? 'text-emerald-300' : 'text-rose-300'}>{product.status === '1' ? 'Aktif' : 'Nonaktif'}</span></td>
                </tr>
              ))}
              {products.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">Produk tidak ditemukan.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="-mt-px overflow-hidden rounded-b-2xl border border-white/10 bg-slate-900"><DataTablePagination page={page} pageSize={pageSize} totalRows={totalRows} path="/admin/pascabayar" query={search} /></div>
    </div>
  )
}

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0)
}
