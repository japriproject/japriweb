import { redirect } from 'next/navigation'

type PascabayarKategoriPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function PascabayarKategoriPage({ searchParams }: PascabayarKategoriPageProps) {
  const params = await searchParams
  const kategoriParam = params.kategori
  const brandParam = params.brand

  const kategori = Array.isArray(kategoriParam) ? kategoriParam[0] : kategoriParam
  const brand = Array.isArray(brandParam) ? brandParam[0] : brandParam

  const nextParams = new URLSearchParams()
  if (kategori) nextParams.set('kategori', kategori)
  if (brand) nextParams.set('brand', brand)

  redirect(`/produk-kategori${nextParams.toString() ? `?${nextParams.toString()}` : ''}`)
}
