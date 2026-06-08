import { appendFile, mkdir } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { digiflazzStatusToCode, type DigiflazzData, verifyDigiflazzWebhook } from '@/lib/digiflazz'
import { distributeDigiflazzReferralBonus } from '@/lib/bonus'
import { prisma } from '@/lib/prisma'

const DIGIFLAZZ_LOG_DIR = path.join(process.cwd(), 'logs')
const DIGIFLAZZ_LOG_FILE = path.join(DIGIFLAZZ_LOG_DIR, 'digiflazz-callback.log')

type CallbackLogEntry = {
  event: string
  refId?: string | null
  status?: string | number | null
  signature?: string | null
  rawBody?: string
  message?: string
  details?: unknown
  timestamp: string
}

async function writeDigiflazzCallbackLog(entry: Omit<CallbackLogEntry, 'timestamp'>) {
  const payload: CallbackLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  }

  try {
    await mkdir(DIGIFLAZZ_LOG_DIR, { recursive: true })
    await appendFile(DIGIFLAZZ_LOG_FILE, JSON.stringify(payload) + '\n', 'utf8')
  } catch (error) {
    console.error('Failed to write Digiflazz callback log:', error)
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature')

  if (!verifyDigiflazzWebhook(rawBody, signature)) {
    await writeDigiflazzCallbackLog({
      event: 'invalid_signature',
      signature,
      rawBody,
      message: 'Invalid Digiflazz callback signature',
    })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const body = JSON.parse(rawBody || '{}') as { data?: DigiflazzData }
  const data = body.data
  if (!data?.ref_id) {
    await writeDigiflazzCallbackLog({
      event: 'bad_payload',
      signature,
      rawBody,
      message: 'Digiflazz callback missing ref_id',
      details: body,
    })
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 })
  }

  const status = digiflazzStatusToCode(data.status)

  try {
    let updatedTransactionId: number | null = null
    let transactionFound = false

    await prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{
        id: number
        members: string
        sale: number
        status: number
        type: number
      }>>`
        SELECT id, members, sale, status, type
        FROM transaksi
        WHERE invoice = ${data.ref_id}
        LIMIT 1
      `

      const trx = rows[0]
      if (!trx) return

      transactionFound = true
      updatedTransactionId = trx.id

      await tx.transaksi.update({
        where: { id: trx.id },
        data: {
          status,
          status_update: status === 0 ? 0 : 1,
          sn: data.sn || null,
          desc: data.message || null,
          updated_at: new Date(),
        },
      })

      if (status === 2 && trx.status !== 2 && [1, 2].includes(trx.type)) {
        await tx.$executeRaw`
          UPDATE members
          SET sososo = sososo + ${trx.sale}
          WHERE phone = ${trx.members}
        `
      }

      if (status === 1 && trx.status !== 1 && [1, 2].includes(trx.type)) {
        await distributeDigiflazzReferralBonus(tx, {
          sourceInvoice: data.ref_id,
          memberPhone: trx.members,
        })
      }
    })

    await writeDigiflazzCallbackLog({
      event: transactionFound ? 'processed' : 'transaction_not_found',
      refId: data.ref_id,
      status: data.status,
      signature,
      rawBody,
      message: data.message,
      details: {
        mappedStatus: status,
        transactionId: updatedTransactionId,
        buyerSkuCode: data.buyer_sku_code,
        customerNo: data.customer_no,
        sn: data.sn || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    await writeDigiflazzCallbackLog({
      event: 'processing_error',
      refId: data.ref_id,
      status: data.status,
      signature,
      rawBody,
      message: error instanceof Error ? error.message : 'Unknown Digiflazz callback error',
      details: body,
    })
    console.error('Digiflazz callback error:', error)
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 })
  }
}
