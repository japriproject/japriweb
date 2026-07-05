import 'server-only'
import { generateSecret, generateURI, verify } from 'otplib'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'

type TotpRow = { member_id: number; secret: string; enabled: number }

export async function ensureAdminTotpTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS admin_totp (
      member_id INT NOT NULL PRIMARY KEY,
      secret VARCHAR(255) NOT NULL,
      enabled TINYINT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)
}

export async function getOrCreateAdminTotp(memberId: number) {
  await ensureAdminTotpTable()
  const rows = await prisma.$queryRaw<TotpRow[]>`SELECT member_id, secret, enabled FROM admin_totp WHERE member_id = ${memberId} LIMIT 1`
  if (rows[0]) return rows[0]

  const secret = generateSecret()
  await prisma.$executeRaw`INSERT INTO admin_totp (member_id, secret, enabled) VALUES (${memberId}, ${secret}, 0)`
  return { member_id: memberId, secret, enabled: 0 }
}

export async function createTotpSetup(secret: string, username: string) {
  const uri = generateURI({ issuer: 'Japri Pay Admin', label: username, secret })
  return { uri, qrCode: await QRCode.toDataURL(uri, { width: 240, margin: 1 }) }
}

export async function verifyAdminTotp(token: string, secret: string) {
  const result = await verify({ token: token.replace(/\s/g, ''), secret })
  return result.valid
}

export async function enableAdminTotp(memberId: number) {
  await prisma.$executeRaw`UPDATE admin_totp SET enabled = 1, updated_at = NOW() WHERE member_id = ${memberId}`
}
