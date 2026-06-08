import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('admin123', 12)
  const userHash = await bcrypt.hash('user123', 12)

  await prisma.user.upsert({
    where: { noHp: '08000000000' },
    update: {},
    create: { nama: 'Admin', noHp: '08000000000', email: 'admin@pulsa.com', password: hash, saldo: 1000000, role: 'ADMIN', isVerified: true },
  })

  await prisma.user.upsert({
    where: { noHp: '08111111111' },
    update: {},
    create: { nama: 'Budi Santoso', noHp: '08111111111', email: 'budi@gmail.com', password: userHash, saldo: 150000, isVerified: true },
  })

  const produks = [
    { kode: 'TL5', nama: 'Telkomsel 5.000', kategori: 'PULSA' as const, operator: 'Telkomsel', hargaBeli: 5500, hargaJual: 6000 },
    { kode: 'TL10', nama: 'Telkomsel 10.000', kategori: 'PULSA' as const, operator: 'Telkomsel', hargaBeli: 10500, hargaJual: 11000 },
    { kode: 'TL20', nama: 'Telkomsel 20.000', kategori: 'PULSA' as const, operator: 'Telkomsel', hargaBeli: 20500, hargaJual: 21000 },
    { kode: 'TL50', nama: 'Telkomsel 50.000', kategori: 'PULSA' as const, operator: 'Telkomsel', hargaBeli: 50500, hargaJual: 51500 },
    { kode: 'TL100', nama: 'Telkomsel 100.000', kategori: 'PULSA' as const, operator: 'Telkomsel', hargaBeli: 100000, hargaJual: 101500 },
    { kode: 'XL5', nama: 'XL 5.000', kategori: 'PULSA' as const, operator: 'XL', hargaBeli: 5500, hargaJual: 6000 },
    { kode: 'XL10', nama: 'XL 10.000', kategori: 'PULSA' as const, operator: 'XL', hargaBeli: 10500, hargaJual: 11000 },
    { kode: 'XL50', nama: 'XL 50.000', kategori: 'PULSA' as const, operator: 'XL', hargaBeli: 50500, hargaJual: 51500 },
    { kode: 'IM5', nama: 'Indosat 5.000', kategori: 'PULSA' as const, operator: 'Indosat', hargaBeli: 5500, hargaJual: 6000 },
    { kode: 'IM10', nama: 'Indosat 10.000', kategori: 'PULSA' as const, operator: 'Indosat', hargaBeli: 10500, hargaJual: 11000 },
    { kode: 'IM50', nama: 'Indosat 50.000', kategori: 'PULSA' as const, operator: 'Indosat', hargaBeli: 50500, hargaJual: 51500 },
    { kode: 'TLD1', nama: 'Telkomsel 1GB 7 Hari', kategori: 'PAKET_DATA' as const, operator: 'Telkomsel', hargaBeli: 15000, hargaJual: 16500 },
    { kode: 'TLD2', nama: 'Telkomsel 3GB 30 Hari', kategori: 'PAKET_DATA' as const, operator: 'Telkomsel', hargaBeli: 35000, hargaJual: 37000 },
    { kode: 'TLD3', nama: 'Telkomsel 10GB 30 Hari', kategori: 'PAKET_DATA' as const, operator: 'Telkomsel', hargaBeli: 75000, hargaJual: 78000 },
    { kode: 'XLD1', nama: 'XL 2GB 7 Hari', kategori: 'PAKET_DATA' as const, operator: 'XL', hargaBeli: 18000, hargaJual: 19500 },
    { kode: 'XLD2', nama: 'XL 5GB 30 Hari', kategori: 'PAKET_DATA' as const, operator: 'XL', hargaBeli: 45000, hargaJual: 47000 },
    { kode: 'PLN20', nama: 'PLN 20.000', kategori: 'PLN' as const, operator: 'PLN', hargaBeli: 20000, hargaJual: 21500 },
    { kode: 'PLN50', nama: 'PLN 50.000', kategori: 'PLN' as const, operator: 'PLN', hargaBeli: 50000, hargaJual: 51500 },
    { kode: 'PLN100', nama: 'PLN 100.000', kategori: 'PLN' as const, operator: 'PLN', hargaBeli: 100000, hargaJual: 102000 },
    { kode: 'MLBB5', nama: 'Mobile Legends 86 Diamonds', kategori: 'GAME' as const, operator: 'Moonton', hargaBeli: 15000, hargaJual: 16500 },
    { kode: 'MLBB14', nama: 'Mobile Legends 172 Diamonds', kategori: 'GAME' as const, operator: 'Moonton', hargaBeli: 28000, hargaJual: 30000 },
  ]

  for (const p of produks) {
    await prisma.produk.upsert({ where: { kode: p.kode }, update: {}, create: p })
  }

  console.log('✅ Seed selesai')
}

main().catch(console.error).finally(() => prisma.$disconnect())
