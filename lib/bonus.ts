import { Prisma } from '@prisma/client'

const DEFAULT_DIGIFLAZZ_LEVEL_AMOUNTS = [500, 250, 150, 100, 50]
const DEFAULT_DUITKU_TOPUP_LEVEL_AMOUNTS = [500, 250, 150, 100, 50]

type BonusMemberRow = {
  id: number
  phone: string
  name: string
  reff: number
  upline: number
}

function parseAmountList(raw: string | undefined, fallback: number[]) {
  if (!raw?.trim()) return fallback

  const values = raw
    .split(',')
    .map((value) => Math.floor(Number(value.trim())))
    .filter((value) => Number.isFinite(value) && value > 0)

  return values.length > 0 ? values.slice(0, 5) : fallback
}

async function findMemberByPhone(tx: Prisma.TransactionClient, phone: string) {
  const rows = await tx.$queryRaw<BonusMemberRow[]>`
    SELECT id, phone, name, reff, upline
    FROM members
    WHERE phone = ${phone}
    LIMIT 1
  `

  return rows[0] ?? null
}

async function findMemberByReff(tx: Prisma.TransactionClient, reff: number) {
  const rows = await tx.$queryRaw<BonusMemberRow[]>`
    SELECT id, phone, name, reff, upline
    FROM members
    WHERE reff = ${reff}
    LIMIT 1
  `

  return rows[0] ?? null
}

async function createBonusTransaction(
  tx: Prisma.TransactionClient,
  {
    invoice,
    memberPhone,
    bonusAmount,
    product,
    desc,
  }: {
    invoice: string
    memberPhone: string
    bonusAmount: number
    product: string
    desc: string
  }
) {
  if (bonusAmount <= 0) return false

  const existingRows = await tx.$queryRaw<Array<{ id: number }>>`
    SELECT id
    FROM transaksi
    WHERE invoice = ${invoice}
    LIMIT 1
  `

  if (existingRows[0]) return false

  await tx.$executeRaw`
    UPDATE members
    SET bobobo = bobobo + ${bonusAmount}
    WHERE phone = ${memberPhone}
  `

  await tx.transaksi.create({
    data: {
      invoice,
      members: memberPhone,
      product,
      customers: memberPhone,
      sale: bonusAmount,
      price: bonusAmount,
      admin: 0,
      status: 0,
      type: 7,
      claim: 0,
      status_update: 0,
      migrasi: 0,
      desc,
      date: new Date(),
    },
  })

  return true
}

export async function distributeDigiflazzReferralBonus(
  tx: Prisma.TransactionClient,
  {
    sourceInvoice,
    memberPhone,
  }: {
    sourceInvoice: string
    memberPhone: string
  }
) {
  const levelAmounts = parseAmountList(
    process.env.DIGIFLAZZ_BONUS_AMOUNTS || process.env.DIGIFLAZZ_BONUS_LEVELS,
    DEFAULT_DIGIFLAZZ_LEVEL_AMOUNTS
  )
  const member = await findMemberByPhone(tx, memberPhone)
  if (!member) return { distributed: 0, levelCount: 0 }

  let currentUpline = member.upline
  let distributed = 0
  let levelCount = 0

  for (let index = 0; index < levelAmounts.length; index += 1) {
    if (!currentUpline) break

    const uplineMember = await findMemberByReff(tx, currentUpline)
    if (!uplineMember) break

    const bonusAmount = levelAmounts[index]
    const created = await createBonusTransaction(tx, {
      invoice: `BONUS-DF-${sourceInvoice}-L${index + 1}`,
      memberPhone: uplineMember.phone,
      bonusAmount,
      product: `BONUS_DF_L${index + 1}`,
      desc: `Bonus referral level ${index + 1} dari transaksi ${sourceInvoice}`,
    })

    if (created) {
      distributed += bonusAmount
      levelCount += 1
    }

    currentUpline = uplineMember.upline
  }

  return { distributed, levelCount }
}

export async function applyDuitkuTopupBonus(
  tx: Prisma.TransactionClient,
  {
    sourceInvoice,
    memberPhone,
  }: {
    sourceInvoice: string
    memberPhone: string
  }
) {
  const levelAmounts = parseAmountList(
    process.env.DUITKU_TOPUP_BONUS_AMOUNTS || process.env.DUITKU_TOPUP_BONUS_LEVELS || process.env.DUITKU_TOPUP_BONUS_PERCENT,
    DEFAULT_DUITKU_TOPUP_LEVEL_AMOUNTS
  )
  const member = await findMemberByPhone(tx, memberPhone)
  if (!member) return { distributed: 0, levelCount: 0 }

  let currentUpline = member.upline
  let distributed = 0
  let levelCount = 0

  for (let index = 0; index < levelAmounts.length; index += 1) {
    if (!currentUpline) break

    const uplineMember = await findMemberByReff(tx, currentUpline)
    if (!uplineMember) break

    const bonusAmount = levelAmounts[index]
    const created = await createBonusTransaction(tx, {
      invoice: `BONUS-TOPUP-${sourceInvoice}-L${index + 1}`,
      memberPhone: uplineMember.phone,
      bonusAmount,
      product: `BONUS_TOPUP_L${index + 1}`,
      desc: `Bonus top up level ${index + 1} dari invoice ${sourceInvoice}`,
    })

    if (created) {
      distributed += bonusAmount
      levelCount += 1
    }

    currentUpline = uplineMember.upline
  }

  return { distributed, levelCount }
}
