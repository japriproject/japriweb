import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function readConfig() {
  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD || ''
  const name = (process.env.ADMIN_NAME || 'Administrator').trim()
  const email = (process.env.ADMIN_EMAIL || `${username}@localhost`).trim().toLowerCase()
  const phone = (process.env.ADMIN_PHONE || '628000000000').trim()

  if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
    throw new Error('ADMIN_USERNAME hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau strip (3-50 karakter).')
  }
  if (password.length < 8 || password.length > 72) {
    throw new Error('ADMIN_PASSWORD wajib diisi dengan panjang 8-72 karakter.')
  }
  if (!name || name.length > 125) throw new Error('ADMIN_NAME tidak valid.')
  if (!email.includes('@') || email.length > 100) throw new Error('ADMIN_EMAIL tidak valid.')
  if (!/^\d{8,20}$/.test(phone)) throw new Error('ADMIN_PHONE harus berisi 8-20 digit.')

  return { username, password, name, email, phone }
}

async function ensureAdmin() {
  const config = readConfig()
  const passwordHash = await bcrypt.hash(config.password, 12)
  const existingAdmin = await prisma.members.findFirst({
    where: { type: 1 },
    orderBy: { id: 'asc' },
    select: { id: true },
  })

  if (existingAdmin) {
    await prisma.members.updateMany({
      where: { id: existingAdmin.id },
      data: {
        name: config.name,
        email: config.email,
        password: passwordHash,
        type: 1,
        status: 1,
        login_status: 0,
      },
    })
    console.log(`[admin:ensure] Admin diperbarui (username: ${config.username}).`)
    return
  }

  const conflictingPhone = await prisma.members.findUnique({
    where: { phone: config.phone },
    select: { id: true },
  })
  if (conflictingPhone) {
    throw new Error('ADMIN_PHONE sudah dipakai member non-admin. Gunakan ADMIN_PHONE lain.')
  }

  const maxReference = await prisma.members.aggregate({ _max: { reff: true } })
  const nextReference = Math.max(100000, (maxReference._max.reff || 0) + 1)

  await prisma.members.create({
    data: {
      sender: config.phone,
      reff: nextReference,
      name: config.name,
      phone: config.phone,
      email: config.email,
      email_verified_at: new Date(),
      password: passwordHash,
      type: 1,
      status: 1,
      login_status: 0,
    },
  })
  console.log(`[admin:ensure] Admin dibuat (username: ${config.username}).`)
}

ensureAdmin()
  .catch((error) => {
    console.error('[admin:ensure] Gagal:', error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
