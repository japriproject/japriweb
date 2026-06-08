'use client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield } from 'lucide-react'

const SECTIONS = [
  {
    title: '1. Informasi yang Kami Kumpulkan',
    content: [
      'Informasi pribadi: nama, nomor HP, alamat email yang Anda berikan saat registrasi.',
      'Informasi transaksi: riwayat pembelian, jumlah top up, dan detail pembayaran.',
      'Informasi perangkat: IP address, jenis perangkat, dan sistem operasi untuk keamanan.',
      'Data penggunaan: aktivitas aplikasi dan preferensi penggunaan untuk meningkatkan layanan.',
    ]
  },
  {
    title: '2. Bagaimana Kami Menggunakan Informasi',
    content: [
      'Memproses transaksi dan pembayaran Anda.',
      'Mengirim notifikasi terkait transaksi dan pembaruan layanan.',
      'Meningkatkan keamanan dan mencegah penipuan.',
      'Menganalisis penggunaan untuk meningkatkan kualitas layanan.',
      'Memberikan dukungan pelanggan yang lebih baik.',
    ]
  },
  {
    title: '3. Penyimpanan Data',
    content: [
      'Data pribadi Anda disimpan secara aman di server yang terenkripsi.',
      'Kami menerapkan standar keamanan industri untuk melindungi informasi Anda.',
      'Data transaksi disimpan sesuai dengan peraturan perundang-undangan yang berlaku.',
      'Akses ke data pribadi dibatasi hanya untuk personel yang berwenang.',
    ]
  },
  {
    title: '4. Berbagi Informasi',
    content: [
      'Kami tidak akan menjual data pribadi Anda kepada pihak ketiga.',
      'Informasi dapat dibagikan dengan penyedia layanan pembayaran untuk memproses transaksi.',
      'Data dapat dibagikan dengan operator telekomunikasi untuk menyelesaikan pembelian produk.',
      'Informasi dapat diungkapkan jika diwajibkan oleh hukum atau untuk melindungi hak kami.',
    ]
  },
  {
    title: '5. Keamanan Data',
    content: [
      'Kami menggunakan enkripsi SSL/TLS untuk melindungi transmisi data.',
      'Password Anda disimpan dengan hashing bcrypt yang tidak dapat dibalik.',
      'Sistem keamanan berlapis untuk mencegah akses tidak sah.',
      'Pemantauan aktif terhadap aktivitas mencurigakan.',
      'Backup data secara berkala untuk mencegah kehilangan data.',
    ]
  },
  {
    title: '6. Cookie dan Teknologi Pelacakan',
    content: [
      'Kami menggunakan cookie untuk menjaga sesi login Anda.',
      'Cookie membantu kami mengingat preferensi Anda.',
      'Anda dapat mengatur browser untuk menolak cookie, namun beberapa fitur mungkin tidak berfungsi.',
      'Kami tidak menggunakan cookie untuk iklan pihak ketiga.',
    ]
  },
  {
    title: '7. Hak Pengguna',
    content: [
      'Anda berhak mengakses dan memperbarui informasi pribadi Anda.',
      'Anda dapat meminta penghapusan akun dan data pribadi (sesuai ketentuan).',
      'Anda berhak menolak penggunaan data untuk tujuan pemasaran.',
      'Anda dapat mengajukan keluhan terkait pengelolaan data pribadi.',
    ]
  },
  {
    title: '8. Data Anak-Anak',
    content: [
      'Layanan kami tidak ditujukan untuk anak di bawah 17 tahun.',
      'Kami tidak dengan sengaja mengumpulkan data dari anak-anak.',
      'Jika Anda di bawah 17 tahun, gunakan aplikasi dengan pengawasan orang tua/wali.',
    ]
  },
  {
    title: '9. Perubahan Kebijakan',
    content: [
      'Kami dapat memperbarui kebijakan privasi ini sewaktu-waktu.',
      'Perubahan akan diinformasikan melalui aplikasi atau email.',
      'Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan.',
      'Tanggal pembaruan terakhir akan selalu ditampilkan.',
    ]
  },
  {
    title: '10. Hubungi Kami',
    content: [
      'Untuk pertanyaan tentang kebijakan privasi, hubungi:',
      'Email: privacy@japripay.com',
      'WhatsApp: +62 812-3456-7890',
      'Alamat: Jl. Sudirman No. 123, Jakarta Selatan 12190',
    ]
  },
]

export default function KebijakanPrivasiPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Kebijakan Privasi</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">Perlindungan data & privasi Anda</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5 pb-20">
        <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100/80">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Shield size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Kebijakan Privasi</p>
              <p className="text-xs text-gray-500">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <p className="text-xs text-emerald-700 leading-relaxed">
              Japri Pay berkomitmen untuk melindungi privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.
            </p>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((section, i) => (
              <div key={i}>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{section.title}</h3>
                <ul className="space-y-2">
                  {section.content.map((item, j) => (
                    <li key={j} className="text-xs text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Dengan menggunakan Japri Pay, Anda menyetujui pengumpulan dan penggunaan informasi sesuai dengan kebijakan privasi ini. Jika tidak setuju, mohon hentikan penggunaan aplikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
