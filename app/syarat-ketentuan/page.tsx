'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'

const SECTIONS = [
  {
    title: '1. Ketentuan Umum',
    content: [
      'Dengan menggunakan aplikasi Japri Pay, Anda setuju untuk terikat dengan syarat dan ketentuan yang berlaku.',
      'Japri Pay berhak mengubah syarat dan ketentuan sewaktu-waktu tanpa pemberitahuan sebelumnya.',
      'Pengguna wajib berusia minimal 17 tahun atau memiliki izin dari orang tua/wali.',
    ]
  },
  {
    title: '2. Akun Pengguna',
    content: [
      'Setiap pengguna bertanggung jawab atas keamanan akun dan kata sandi mereka.',
      'Pengguna tidak diperkenankan membagikan akun kepada pihak lain.',
      'TopUp App tidak bertanggung jawab atas kerugian yang timbul akibat kelalaian pengguna dalam menjaga keamanan akun.',
    ]
  },
  {
    title: '3. Transaksi',
    content: [
      'Semua transaksi yang telah berhasil tidak dapat dibatalkan atau direfund.',
      'Pastikan nomor tujuan dan produk yang dipilih sudah benar sebelum melakukan pembayaran.',
      'Proses transaksi umumnya berlangsung 1-5 menit, maksimal 1x24 jam.',
      'Jika transaksi gagal, saldo akan dikembalikan secara otomatis ke akun pengguna.',
    ]
  },
  {
    title: '4. Pembayaran & Top Up',
    content: [
      'Japri Pay menyediakan berbagai metode pembayaran yang aman dan terpercaya.',
      'Biaya admin dan kode unik akan ditambahkan pada setiap transaksi top up.',
      'Saldo yang sudah masuk tidak dapat ditarik kembali dalam bentuk uang tunai.',
      'Top up saldo minimal Rp 10.000.',
    ]
  },
  {
    title: '5. Program Referral',
    content: [
      'Pengguna dapat mengajak orang lain untuk bergabung menggunakan kode referral.',
      'Bonus referral akan diberikan sesuai dengan ketentuan yang berlaku.',
      'TopUp App berhak membatalkan bonus jika ditemukan kecurangan atau pelanggaran.',
    ]
  },
  {
    title: '6. Privasi & Keamanan',
    content: [
      'Japri Pay berkomitmen menjaga kerahasiaan data pribadi pengguna.',
      'Data transaksi dan informasi akun akan dijaga keamanannya sesuai standar industri.',
      'Japri Pay tidak akan membagikan data pengguna kepada pihak ketiga tanpa izin.',
    ]
  },
  {
    title: '7. Larangan',
    content: [
      'Dilarang menggunakan aplikasi untuk tujuan ilegal atau melanggar hukum.',
      'Dilarang melakukan manipulasi sistem atau mencoba mengakses akun orang lain.',
      'Dilarang menyebarkan informasi palsu atau menyesatkan.',
      'Japri Pay berhak menutup akun pengguna yang melanggar ketentuan tanpa pemberitahuan.',
    ]
  },
  {
    title: '8. Tanggung Jawab',
    content: [
      'Japri Pay tidak bertanggung jawab atas kerugian yang timbul dari kesalahan pengguna.',
      'Japri Pay tidak bertanggung jawab atas gangguan layanan dari pihak ketiga (provider).',
      'Japri Pay akan berusaha memberikan layanan terbaik namun tidak menjamin layanan 100% tanpa gangguan.',
    ]
  },
  {
    title: '9. Penyelesaian Sengketa',
    content: [
      'Segala sengketa yang timbul akan diselesaikan secara musyawarah.',
      'Jika tidak tercapai kesepakatan, penyelesaian akan dilakukan sesuai hukum yang berlaku di Indonesia.',
      'Untuk keluhan atau komplain, silakan hubungi customer service kami.',
    ]
  },
  {
    title: '10. Kontak',
    content: [
      'Email: support@japripay.com',
      'WhatsApp: +62 812-3456-7890',
      'Hotline: 0800-1234-5678',
    ]
  },
]

export default function SyaratKetentuanPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Syarat & Ketentuan</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">Ketentuan penggunaan layanan</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5 pb-20">
        <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100/80">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <FileText size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Syarat & Ketentuan</p>
              <p className="text-xs text-gray-500">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((section, i) => (
              <div key={i}>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{section.title}</h3>
                <ul className="space-y-2">
                  {section.content.map((item, j) => (
                    <li key={j} className="text-xs text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-violet-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Dengan melanjutkan menggunakan layanan Japri Pay, Anda dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
