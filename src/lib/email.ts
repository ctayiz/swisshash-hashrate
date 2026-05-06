import nodemailer from 'nodemailer'

function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendOrderConfirmation(opts: {
  to: string
  orderId: string
  packageName: string
  hashrate_th: number
  duration_days: number
  price_usd: number
}): Promise<void> {
  const transporter = createTransporter()
  if (!transporter) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://swisshash.com'

  await transporter.sendMail({
    from: `"SwissHash" <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: `Bestellung erhalten – ${opts.packageName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <div style="background:#f97316;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#fff;margin:0;font-size:20px">SwissHash</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
          <h2 style="margin-top:0">Bestellung eingegangen ✓</h2>
          <p>Vielen Dank für deine Bestellung. Sie wird nach Zahlungseingang aktiviert.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px 0;color:#64748b">Paket</td>
              <td style="padding:10px 0;font-weight:600">${opts.packageName}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px 0;color:#64748b">Hashrate</td>
              <td style="padding:10px 0;font-weight:600">${opts.hashrate_th} TH/s</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px 0;color:#64748b">Laufzeit</td>
              <td style="padding:10px 0;font-weight:600">${opts.duration_days} Tage</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b">Preis</td>
              <td style="padding:10px 0;font-weight:600">$${opts.price_usd} USD</td>
            </tr>
          </table>
          <a href="${appUrl}/orders/${opts.orderId}"
             style="display:inline-block;background:#f97316;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
            Bestellung ansehen →
          </a>
          <p style="color:#94a3b8;font-size:13px;margin-top:32px">
            Bei Fragen: <a href="mailto:ticket@swisshash.com" style="color:#f97316">ticket@swisshash.com</a>
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendCustomQuoteRequest(opts: {
  customerEmail: string
  hashrate_th: number
  duration_days: number
  message: string
}): Promise<void> {
  const transporter = createTransporter()
  if (!transporter) return

  const adminEmail = process.env.ADMIN_EMAIL ?? 'ticket@swisshash.com'

  await transporter.sendMail({
    from: `"SwissHash" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    replyTo: opts.customerEmail,
    subject: `[Individuelles Angebot] ${opts.hashrate_th} TH/s · ${opts.duration_days} Tage — ${opts.customerEmail}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#f97316;margin:0;font-size:18px">SwissHash — Angebotsanfrage</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
          <p style="margin-top:0">Ein Kunde möchte ein individuelles Angebot.</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px 0;color:#64748b">Kunde</td>
              <td style="padding:10px 0;font-weight:600">${opts.customerEmail}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px 0;color:#64748b">Gewünschte Hashrate</td>
              <td style="padding:10px 0;font-weight:600">${opts.hashrate_th} TH/s</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px 0;color:#64748b">Gewünschte Laufzeit</td>
              <td style="padding:10px 0;font-weight:600">${opts.duration_days} Tage</td>
            </tr>
            ${opts.message ? `
            <tr>
              <td style="padding:10px 0;color:#64748b;vertical-align:top">Nachricht</td>
              <td style="padding:10px 0;white-space:pre-wrap">${opts.message.replace(/</g, '&lt;')}</td>
            </tr>` : ''}
          </table>
          <p style="color:#64748b;font-size:13px">
            Antworte direkt auf diese E-Mail um den Kunden zu kontaktieren.
          </p>
        </div>
      </div>
    `,
  })
}

export async function sendAdminNewOrderNotification(opts: {
  customerEmail: string
  orderId: string
  packageName: string
  hashrate_th: number
  duration_days: number
  price_usd: number
}): Promise<void> {
  const transporter = createTransporter()
  if (!transporter) return

  const adminEmail = process.env.ADMIN_EMAIL ?? 'ticket@swisshash.com'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://swisshash.com'

  await transporter.sendMail({
    from: `"SwissHash" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `[Neue Bestellung] ${opts.packageName} von ${opts.customerEmail}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0">
          <h1 style="color:#f97316;margin:0;font-size:18px">SwissHash — Neue Bestellung</h1>
        </div>
        <div style="background:#f8fafc;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e2e8f0">
          <p style="margin-top:0">Eine neue Bestellung ist eingegangen und wartet auf Aktivierung.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px 0;color:#64748b">Kunde</td>
              <td style="padding:10px 0;font-weight:600">${opts.customerEmail}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px 0;color:#64748b">Paket</td>
              <td style="padding:10px 0;font-weight:600">${opts.packageName}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px 0;color:#64748b">Hashrate</td>
              <td style="padding:10px 0;font-weight:600">${opts.hashrate_th} TH/s</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:10px 0;color:#64748b">Laufzeit</td>
              <td style="padding:10px 0;font-weight:600">${opts.duration_days} Tage</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b">Preis</td>
              <td style="padding:10px 0;font-weight:600">$${opts.price_usd} USD</td>
            </tr>
          </table>
          <a href="${appUrl}/admin/orders/${opts.orderId}"
             style="display:inline-block;background:#1e293b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">
            Bestellung im Admin öffnen →
          </a>
        </div>
      </div>
    `,
  })
}

export async function sendSupportMail(opts: {
  fromEmail: string
  subject: string
  message: string
}): Promise<void> {
  const transporter = createTransporter()
  if (!transporter) return

  await transporter.sendMail({
    from: `"SwissHash Support" <${process.env.SMTP_USER}>`,
    to: 'ticket@swisshash.com',
    replyTo: opts.fromEmail,
    subject: `[Support] ${opts.subject}`,
    text: `Von: ${opts.fromEmail}\n\n${opts.message}`,
    html: `
      <p><strong>Von:</strong> ${opts.fromEmail}</p>
      <hr/>
      <p style="white-space:pre-wrap">${opts.message.replace(/</g, '&lt;')}</p>
    `,
  })
}
