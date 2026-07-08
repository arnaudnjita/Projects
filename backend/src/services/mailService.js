const nodemailer = require('nodemailer')

const env = require('../config/env')

function createTransport() {
  if (env.nodeEnv === 'test') {
    return nodemailer.createTransport({ jsonTransport: true })
  }

  return nodemailer.createTransport({
    auth: {
      pass: env.smtp.pass,
      user: env.smtp.user,
    },
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
  })
}

function buildPasswordResetEmail({ name, resetUrl }) {
  return {
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1E2923;">
        <h1 style="color: #123F2D;">CultivaX password reset</h1>
        <p>Hello ${name},</p>
        <p>Use the link below to reset your CultivaX password. This link expires in 30 minutes.</p>
        <p><a href="${resetUrl}" style="color: #0B2E20;">Reset your password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    text: [
      'CultivaX password reset',
      '',
      `Hello ${name},`,
      'Use this link to reset your CultivaX password. It expires in 30 minutes:',
      resetUrl,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
  }
}

async function sendPasswordResetEmail({ email, name, resetUrl }) {
  const transport = createTransport()
  const message = buildPasswordResetEmail({ name, resetUrl })

  if (env.nodeEnv === 'development' && env.allowDevResetTokenLogging) {
    console.log(`Development password reset URL for ${email}: ${resetUrl}`)
  }

  await transport.sendMail({
    from: env.smtp.from,
    html: message.html,
    subject: 'Reset your CultivaX password',
    text: message.text,
    to: email,
  })
}

module.exports = {
  buildPasswordResetEmail,
  sendPasswordResetEmail,
}
