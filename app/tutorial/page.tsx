import type { Metadata } from 'next'
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  FolderGit2,
  Globe2,
  Lock,
  Server,
  ShieldCheck,
  TerminalSquare,
  Zap,
} from 'lucide-react'

const githubUrl = 'https://github.com/japriproject/japriweb.git'

const steps = [
  {
    title: 'Konek SSH',
    label: 'Step 01',
    text: 'Masuk dulu ke VPS sebagai root atau user sudo.',
    code: `ssh root@IP_SERVER

# kalau port SSH bukan 22
ssh -p 22 root@IP_SERVER`,
  },
  {
    title: 'Update server',
    label: 'Step 02',
    text: 'Install paket dasar, Apache2, Git, dan Certbot untuk SSL.',
    code: `apt update && apt upgrade -y
apt install -y git curl apache2 certbot python3-certbot-apache`,
  },
  {
    title: 'Install Node.js',
    label: 'Step 03',
    text: 'Pakai Node.js LTS agar Next.js production stabil.',
    code: `curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

node -v
npm -v`,
  },
  {
    title: 'Clone project',
    label: 'Step 04',
    text: 'Ambil source code langsung dari repository GitHub Japri.',
    code: `mkdir -p /home/japriweb
cd /home/japriweb

git clone ${githubUrl} pulsa-app
cd pulsa-app`,
  },
  {
    title: 'Setup .env',
    label: 'Step 05',
    text: 'Isi konfigurasi production. Jangan upload atau share file .env.',
    code: `cp .env.example .env
nano .env

DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/NAMA_DB"
NEXTAUTH_URL="https://domainanda.com"
NEXT_PUBLIC_APP_URL="https://domainanda.com"
JWT_SECRET="ganti-dengan-secret-panjang"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="ganti-password-kuat"`,
  },
  {
    title: 'Install dependency',
    label: 'Step 06',
    text: 'Install package sesuai lockfile, lalu generate Prisma Client.',
    code: `npm ci
npx prisma generate`,
  },
  {
    title: 'Buat credential admin',
    label: 'Step 07',
    text: 'Script ini memastikan akun admin tersedia di database server.',
    code: `npm run admin:ensure`,
  },
  {
    title: 'Build production',
    label: 'Step 08',
    text: 'Pastikan build selesai tanpa error sebelum dijalankan.',
    code: `npm run build`,
  },
  {
    title: 'Jalankan PM2',
    label: 'Step 09',
    text: 'PM2 menjaga aplikasi tetap online setelah terminal ditutup.',
    code: `npm install -g pm2

PORT=3000 pm2 start npm --name pulsa-app -- start
pm2 save
pm2 startup`,
  },
  {
    title: 'Aktifkan proxy Apache',
    label: 'Step 10',
    text: 'Apache akan meneruskan request domain ke Next.js di port 3000.',
    code: `a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod headers
a2enmod rewrite
systemctl restart apache2`,
  },
  {
    title: 'VirtualHost Apache',
    label: 'Step 11',
    text: 'Ganti domainanda.com dengan domain asli yang DNS-nya sudah mengarah ke VPS.',
    code: `nano /etc/apache2/sites-available/domainanda.com.conf`,
    extra: `<VirtualHost *:80>
    ServerName domainanda.com
    ServerAlias www.domainanda.com

    ProxyPreserveHost On
    ProxyRequests Off

    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    RequestHeader set X-Forwarded-Proto "http"
    RequestHeader set X-Forwarded-Port "80"

    ErrorLog \${APACHE_LOG_DIR}/domainanda-error.log
    CustomLog \${APACHE_LOG_DIR}/domainanda-access.log combined
</VirtualHost>`,
  },
  {
    title: 'Enable site',
    label: 'Step 12',
    text: 'Cek config dulu, baru reload Apache.',
    code: `a2dissite 000-default.conf
a2ensite domainanda.com.conf
apache2ctl configtest
systemctl reload apache2`,
  },
  {
    title: 'Aktifkan HTTPS',
    label: 'Step 13',
    text: 'Pasang SSL gratis dari Let’s Encrypt setelah HTTP sudah bisa dibuka.',
    code: `certbot --apache -d domainanda.com -d www.domainanda.com

certbot renew --dry-run`,
  },
  {
    title: 'Update berikutnya',
    label: 'Step 14',
    text: 'Alur deploy saat ada update kode dari GitHub.',
    code: `cd /home/japriweb/pulsa-app
git pull
npm ci
npx prisma generate
npm run admin:ensure
npm run build
pm2 restart pulsa-app --update-env`,
  },
]

const checklist = [
  'DNS domain mengarah ke IP VPS.',
  'Port 80 dan 443 terbuka.',
  'PM2 status pulsa-app online.',
  'Apache configtest hasilnya Syntax OK.',
  'HTTPS berhasil aktif.',
]

export const metadata: Metadata = {
  title: 'Tutorial Instalasi Server - Japri Pay',
  description: 'Panduan deploy Japri Pay ke VPS dari SSH sampai Apache2 proxy.',
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="max-h-80 overflow-x-auto rounded-2xl border border-gray-100 bg-gray-950 p-4 text-[11px] leading-5 text-emerald-100 shadow-inner">
      <code>{children}</code>
    </pre>
  )
}

export default function TutorialInstalasiServerPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-8">
      <section className="gradient-primary relative overflow-hidden px-6 pb-16 pt-12 text-white">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/5" />
        <div className="absolute bottom-2 right-8 h-20 w-20 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15">
            <Server size={28} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[.25em] text-white/60">
            Japri Pay Guide
          </p>
          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight">
            Tutorial Instalasi ke Server
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-white/70">
            Dari konek SSH, clone GitHub, build Next.js, PM2, proxy Apache2,
            sampai website bisa dibuka via HTTPS.
          </p>
        </div>
      </section>

      <section className="relative z-10 -mt-9 space-y-4 px-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-xl shadow-violet-500/10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <FolderGit2 size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Repository
              </p>
              <p className="truncate text-sm font-bold text-gray-900">
                japriproject/japriweb.git
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-gray-50 p-3">
            <p className="break-all text-xs font-semibold leading-5 text-gray-600">
              {githubUrl}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white bg-white p-3 text-center shadow-sm">
            <TerminalSquare className="mx-auto text-violet-600" size={20} />
            <p className="mt-2 text-[10px] font-bold text-gray-700">SSH</p>
          </div>
          <div className="rounded-2xl border border-white bg-white p-3 text-center shadow-sm">
            <Zap className="mx-auto text-amber-500" size={20} />
            <p className="mt-2 text-[10px] font-bold text-gray-700">PM2</p>
          </div>
          <div className="rounded-2xl border border-white bg-white p-3 text-center shadow-sm">
            <Globe2 className="mx-auto text-emerald-500" size={20} />
            <p className="mt-2 text-[10px] font-bold text-gray-700">Apache</p>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <article
              key={step.title}
              className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-violet-600">
                    {step.label}
                  </span>
                  <Copy size={15} className="text-gray-300" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">{step.title}</h2>
                <p className="mt-1.5 text-sm leading-6 text-gray-500">{step.text}</p>
                <div className="mt-4 space-y-3">
                  <CodeBlock>{step.code}</CodeBlock>
                  {step.extra ? <CodeBlock>{step.extra}</CodeBlock> : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Checklist selesai</h2>
              <p className="text-xs text-gray-400">Pastikan ini sudah aman.</p>
            </div>
          </div>
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item} className="flex gap-3 text-sm font-medium text-gray-600">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-rose-50 p-5">
          <div className="flex gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-500" />
            <div>
              <h2 className="font-bold text-rose-700">Kalau 502 atau blank</h2>
              <p className="mt-1 text-sm leading-6 text-rose-600/80">
                Cek <b>pm2 logs pulsa-app</b>, pastikan app hidup di port 3000,
                lalu jalankan <b>pm2 restart pulsa-app --update-env</b> dan
                <b> systemctl reload apache2</b>.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-violet-100 bg-white p-5">
          <div className="mb-3 flex items-center gap-3">
            <Lock size={18} className="text-violet-600" />
            <h2 className="font-bold text-gray-900">Catatan keamanan</h2>
          </div>
          <p className="text-sm leading-6 text-gray-500">
            Jangan taruh credential asli di GitHub. Simpan semua secret di file
            <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-bold text-gray-700">
              .env
            </code>
            server dan restart PM2 setiap ada perubahan env.
          </p>
        </div>
      </section>
    </main>
  )
}
