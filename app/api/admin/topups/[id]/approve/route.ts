import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminSession } from '@/lib/admin'
import { applyDuitkuTopupBonus } from '@/lib/bonus'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  amount: z.coerce.number().int().min(1).max(2_000_000_000),
})

export async function PATCH(req: NextRequest, context: RouteContext<'/api/admin/topups/[id]/approve'>) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: rawId } = await context.params
  const id = Number(rawId)
  if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: 'ID top up tidak valid' }, { status: 400 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Nominal harus berupa angka lebih dari 0' }, { status: 400 })

  try {
    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: number; invoice: string; members: string; status: number }>>`
        SELECT id, invoice, members, status
        FROM transaksi
        WHERE id = ${id} AND type = 7
        FOR UPDATE
      `
      const topup = rows[0]
      if (!topup) throw new Error('TOPUP_NOT_FOUND')
      if (topup.status !== 0) throw new Error('TOPUP_ALREADY_PROCESSED')

      const memberUpdated = await tx.$executeRaw`
        UPDATE members
        SET sososo = sososo + ${parsed.data.amount}, jumlah_topup = jumlah_topup + 1
        WHERE phone = ${topup.members} AND type <> 1
      `
      if (memberUpdated !== 1) throw new Error('MEMBER_NOT_FOUND')

      await tx.transaksi.update({
        where: { id: topup.id },
        data: {
          sale: parsed.data.amount,
          status: 1,
          status_update: 1,
          desc: `Top up disetujui manual oleh ${admin.name}`,
          updated_at: new Date(),
        },
      })

      await applyDuitkuTopupBonus(tx, { sourceInvoice: topup.invoice, memberPhone: topup.members })
      return { invoice: topup.invoice, amount: parsed.data.amount }
    })

    return NextResponse.json({ message: 'Top up berhasil disetujui dan saldo member ditambahkan', ...result })
  } catch (error) {
    const reason = error instanceof Error ? error.message : ''
    if (reason === 'TOPUP_NOT_FOUND') return NextResponse.json({ error: 'Top up tidak ditemukan' }, { status: 404 })
    if (reason === 'TOPUP_ALREADY_PROCESSED') return NextResponse.json({ error: 'Top up sudah diproses sebelumnya' }, { status: 409 })
    if (reason === 'MEMBER_NOT_FOUND') return NextResponse.json({ error: 'Member tujuan tidak ditemukan' }, { status: 404 })
    console.error('Admin approve topup failed', { id, error })
    return NextResponse.json({ error: 'Gagal menyetujui top up' }, { status: 500 })
  }
}
