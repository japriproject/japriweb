'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Building2, MapPin, Globe, Mail, Phone, MessageCircle } from 'lucide-react'

const FAQ_DATA = [
  {
    q: 'Bagaimana cara top up saldo?',
    a: 'Klik menu Top Up di dashboard, pilih metode pembayaran, masukkan nominal, lalu ikuti instruksi pembayaran. Saldo akan otomatis masuk setelah pembayaran dikonfirmasi.'
  },
  {
    q: 'Berapa lama proses transaksi pulsa?',
    a: 'Transaksi pulsa diproses secara real-time dan biasanya masuk dalam 1-5 menit. Jika lebih dari 15 menit belum masuk, silakan hubungi customer service.'
  },
  {
    q: 'Apakah ada biaya admin untuk transaksi?',
    a: 'Tidak ada biaya admin tambahan. Harga yang tertera sudah merupakan harga final yang akan dibayarkan.'
  },
  {
    q: 'Bagaimana cara menjadi mitra/reseller?',
    a: 'Klik menu Register di dashboard untuk mendaftarkan mitra baru dengan kode referral Anda. Mitra akan mendapatkan bonus dari setiap transaksi.'
  },
  {
    q: 'Apakah bisa refund jika salah nomor?',
    a: 'Transaksi yang sudah berhasil tidak dapat dibatalkan atau direfund. Pastikan nomor tujuan sudah benar sebelum melakukan pembayaran.'
  },
  {
    q: 'Bagaimana cara melihat riwayat transaksi?',
    a: 'Klik menu Riwayat di bottom navigation untuk melihat semua transaksi Anda. Anda juga bisa filter berdasarkan status transaksi.'
  },
  {
    q: 'Apakah ada program bonus atau cashback?',
    a: 'Ya, kami memiliki program bonus untuk mitra yang aktif bertransaksi. Cek menu Bonus untuk melihat detail bonus Anda.'
  },
  {
    q: 'Bagaimana jika transaksi pending?',
    a: 'Transaksi pending biasanya akan diproses dalam 1x24 jam. Jika lebih dari itu, silakan hubungi customer service dengan menyertakan nomor invoice.'
  }
]

const COMPANY_INFO = {
  name: 'Japri Pay Indonesia',
  address: 'Jl. Sudirman No. 123, Jakarta Selatan 12190',
  website: 'https://japripay.com',
  email: 'support@japripay.com',
  hotline: '0800-1234-5678',
  whatsapp: '+62 812-3456-7890'
}

export default function SupportPage() {
  const router = useRouter()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="gradient-primary px-5 pt-12 pb-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative z-10">
          <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-white/60 text-sm font-medium">
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1 className="text-xl font-bold">Bantuan & Support</h1>
          <p className="text-white/60 text-sm mt-0.5 font-medium">Pusat informasi dan kontak kami</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3.5 pb-20">
        {/* Informasi Perusahaan */}
        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <Building2 size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Informasi Perusahaan</p>
              <p className="text-xs text-gray-500">Hubungi kami untuk bantuan</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <Building2 size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">Nama Perusahaan</p>
                <p className="text-sm font-semibold text-gray-900">{COMPANY_INFO.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">Alamat</p>
                <p className="text-sm font-medium text-gray-900">{COMPANY_INFO.address}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <Globe size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">Website</p>
                <a href={COMPANY_INFO.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-violet-600 hover:underline">
                  {COMPANY_INFO.website}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <Mail size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <a href={`mailto:${COMPANY_INFO.email}`} className="text-sm font-medium text-violet-600 hover:underline">
                  {COMPANY_INFO.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <Phone size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">Hotline</p>
                <a href={`tel:${COMPANY_INFO.hotline}`} className="text-sm font-bold text-gray-900">
                  {COMPANY_INFO.hotline}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <MessageCircle size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-emerald-700 mb-0.5 font-medium">WhatsApp</p>
                <a href={`https://wa.me/${COMPANY_INFO.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-600 hover:underline">
                  {COMPANY_INFO.whatsapp}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl p-4 card-shadow border border-gray-100/80">
          <div className="mb-4 pb-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Frequently Asked Questions</p>
            <p className="text-xs text-gray-500 mt-0.5">Pertanyaan yang sering diajukan</p>
          </div>

          <div className="space-y-2">
            {FAQ_DATA.map((faq, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-3.5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900 flex-1">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 shrink-0 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-3.5 pb-3.5 pt-0">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 text-center">
          <p className="text-sm font-bold text-gray-900 mb-1">Butuh Bantuan Lebih Lanjut?</p>
          <p className="text-xs text-gray-600 mb-3">Tim kami siap membantu Anda 24/7</p>
          <a
            href={`https://wa.me/${COMPANY_INFO.whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors btn-press"
          >
            <MessageCircle size={16} />
            Hubungi via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
