function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character)
}

async function sendEmail(input: {
  email: string
  subject: string
  html: string
  idempotencyKey?: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) throw new Error('Konfigurasi email belum lengkap')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'JapriPay/1.0',
      ...(input.idempotencyKey ? { 'Idempotency-Key': input.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: input.subject,
      html: input.html,
    }),
  })

  const responseText = await response.text()
  if (!response.ok) {
    throw new Error(`Resend gagal (${response.status}): ${responseText || 'Tidak ada detail respons'}`)
  }

  return responseText ? JSON.parse(responseText) as { id?: string } : {}
}

export async function sendPasswordResetEmail(input: { email: string; name: string; resetUrl: string }) {
  return sendEmail({
    email: input.email,
    subject: 'Reset password Japri Pay',
    html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033">
          <h2>Reset password</h2>
          <p>Halo ${escapeHtml(input.name || 'Pengguna')},</p>
          <p>Kami menerima permintaan untuk mengganti password akun Japri Pay Anda.</p>
          <p><a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;padding:12px 20px;background:#6d28d9;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Buat Password Baru</a></p>
          <p style="font-size:13px;color:#667085">Tautan ini berlaku selama 30 menit dan hanya dapat digunakan satu kali. Abaikan email ini jika Anda tidak meminta reset password.</p>
        </div>
      `,
  })
}

export async function sendPasswordChangedEmail(input: {
  email: string
  name: string
  changedAt: Date
  ipAddress: string
  userAgent: string
  resetTokenId: number
}) {
  const changedAt = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(input.changedAt)

  return sendEmail({
    email: input.email,
    subject: 'Password Japri Pay berhasil diubah',
    idempotencyKey: `password-changed-${input.resetTokenId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033">
        <h2>Password berhasil diubah</h2>
        <p>Halo ${escapeHtml(input.name || 'Pengguna')},</p>
        <p>Password akun Japri Pay Anda telah berhasil diperbarui.</p>
        <div style="margin:20px 0;padding:16px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px">
          <p style="margin:0 0 8px"><strong>Email akun:</strong> ${escapeHtml(input.email)}</p>
          <p style="margin:0 0 8px"><strong>Waktu:</strong> ${escapeHtml(changedAt)} (WIB)</p>
          <p style="margin:0 0 8px"><strong>Alamat IP:</strong> ${escapeHtml(input.ipAddress || 'Tidak diketahui')}</p>
          <p style="margin:0"><strong>Perangkat:</strong> ${escapeHtml(input.userAgent || 'Tidak diketahui')}</p>
        </div>
        <p>Password tidak dicantumkan dalam email demi keamanan.</p>
        <p style="font-size:13px;color:#b42318"><strong>Jika Anda tidak melakukan perubahan ini, segera hubungi layanan bantuan Japri Pay.</strong></p>
      </div>
    `,
  })
}

export async function sendEmailVerificationEmail(input: {
  email: string
  name: string
  verificationUrl: string
  tokenId: number
}) {
  return sendEmail({
    email: input.email,
    subject: 'Verifikasi email Japri Pay',
    idempotencyKey: `email-verification-${input.tokenId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033">
        <h2>Verifikasi email Anda</h2>
        <p>Halo ${escapeHtml(input.name || 'Pengguna')},</p>
        <p>Klik tombol berikut untuk mengaktifkan <strong>${escapeHtml(input.email)}</strong> sebagai email akun Japri Pay Anda.</p>
        <p><a href="${escapeHtml(input.verificationUrl)}" style="display:inline-block;padding:12px 20px;background:#6d28d9;color:#fff;text-decoration:none;border-radius:10px;font-weight:700">Verifikasi Email</a></p>
        <p style="font-size:13px;color:#667085">Tautan berlaku selama 30 menit dan hanya dapat digunakan satu kali. Abaikan email ini jika Anda tidak melakukan perubahan.</p>
      </div>
    `,
  })
}

export async function sendMitraRegistrationOtpEmail(input: { email: string; name: string; otp: string }) {
  return sendEmail({
    email: input.email,
    subject: 'Kode OTP pendaftaran Mitra Japri Pay',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033">
        <h2>Kode OTP pendaftaran Mitra</h2>
        <p>Halo ${escapeHtml(input.name || 'Mitra')},</p>
        <p>Masukkan kode berikut untuk menyelesaikan pendaftaran Mitra Japri Pay:</p>
        <div style="margin:20px 0;padding:18px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;text-align:center;font-size:30px;font-weight:700;letter-spacing:8px;color:#047857">${escapeHtml(input.otp)}</div>
        <p style="font-size:13px;color:#667085">Kode berlaku selama 5 menit. Jangan berikan kode ini kepada siapa pun.</p>
      </div>
    `,
  })
}
