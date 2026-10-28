import nodemailer from 'nodemailer'
import { config } from '../config.js'

function mailConfigured() {
  return Boolean(
    config.mail.host
    && config.mail.user
    && config.mail.password
    && config.mail.from,
  )
}

export async function sendDoctorSetupEmail({ recipient, doctorName, setupUrl }) {
  if (!mailConfigured()) {
    if (config.isProduction) {
      throw new Error('Doctor setup email delivery is not configured.')
    }
    return { mode: 'development-preview', setupUrl }
  }

  const transporter = nodemailer.createTransport({
    host: config.mail.host,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: { user: config.mail.user, pass: config.mail.password },
  })
  await transporter.sendMail({
    from: config.mail.from,
    to: recipient,
    subject: 'SmartCare doctor account password setup',
    text: `Hello ${doctorName},\n\nUse this link to verify your email and choose your SmartCare password. It expires soon and can be used once:\n\n${setupUrl}\n\nIf you did not expect this message, ignore it.`,
  })
  return { mode: 'smtp' }
}
