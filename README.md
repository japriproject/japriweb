# Pulsa App

Aplikasi web mobile-first untuk pembelian produk prabayar, top up saldo, referral, dan riwayat transaksi.

## Stack

- Next.js App Router + TypeScript
- MySQL existing database + Prisma
- Tailwind CSS v4
- JWT auth via HttpOnly cookie
- Digiflazz untuk transaksi prabayar/pascabayar
- Duitku POP untuk top up QRIS/transfer

## Catatan Data

Project ini tidak memakai seed demo. Data member, produk `pulsa`, produk `pasca`, dan transaksi dibaca dari database existing.

Kolom saldo aktif member yang dipakai aplikasi adalah:

```text
members.sososo
```

Kolom `members.saldo` tidak dipakai untuk perhitungan saldo aplikasi ini.

## Fitur

- Login dan register member
- Dashboard saldo, bonus, dan menu produk
- Beli pulsa dan paket data dari tabel `pulsa`
- Top up saldo via Duitku
- Callback Duitku untuk kredit saldo
- Order Digiflazz untuk prabayar
- Callback Digiflazz untuk update status dan refund transaksi gagal
- Riwayat dan detail transaksi
- Referral dan register mitra

Pascabayar sudah disiapkan untuk jalur Digiflazz `pay-pasca`, tetapi flow inquiry/tagihan detail masih perlu disesuaikan lebih lanjut dengan kebutuhan produk pascabayar masing-masing.

## Environment

```bash
DATABASE_URL="mysql://user:password@localhost:3306/pulsa_db"
JWT_SECRET="ganti-dengan-secret-yang-kuat"
NEXT_PUBLIC_APP_URL="https://domain-anda.com"

DIGIFLAZZ_USERNAME="username-api"
DIGIFLAZZ_API_KEY="api-key"
DIGIFLAZZ_TESTING="false"
DIGIFLAZZ_CALLBACK_URL="https://domain-anda.com/api/digiflazz/callback"
DIGIFLAZZ_WEBHOOK_SECRET="secret-webhook-digiflazz"

DUITKU_MERCHANT_CODE="DXXXX"
DUITKU_MERCHANT_KEY="merchant-key"
DUITKU_SANDBOX="true"
DUITKU_QRIS_METHOD="SP"
DUITKU_TRANSFER_METHOD=""
DUITKU_EXPIRY_MINUTES="15"
```

Untuk Duitku QRIS, default `DUITKU_QRIS_METHOD` adalah `SP`. Ubah ke kode QRIS lain yang aktif di merchant Duitku jika diperlukan.

## Callback Publik

Pastikan URL berikut bisa diakses publik oleh provider:

- Digiflazz: `/api/digiflazz/callback`
- Duitku: `/api/topup/callback/duitku`

Callback Duitku mengkredit saldo hanya saat `resultCode=00`. Callback Digiflazz mengubah status transaksi dan mengembalikan saldo jika status menjadi `Gagal`.

## Setup

```bash
npm install
npx prisma generate
npm run dev
```

Buka `http://localhost:3000`.

## Build

```bash
npm run build
```
