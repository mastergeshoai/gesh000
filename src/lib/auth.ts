import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/lib/db'
import { Resend } from 'resend'

const origin = (value?: string) => value ? (value.startsWith('http') ? value : `https://${value}`) : undefined
const trustedOrigins = [
  'http://localhost:3000', process.env.V0_RUNTIME_URL, process.env.V0_DEV_APP_URL, process.env.V0_BUILD_URL, process.env.V0_SANDBOX_URL,
  origin(process.env.VERCEL_URL), origin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
].filter((value): value is string => Boolean(value))

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  baseURL: process.env.BETTER_AUTH_URL || origin(process.env.VERCEL_PROJECT_PRODUCTION_URL) || origin(process.env.VERCEL_URL) || process.env.V0_RUNTIME_URL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const from = process.env.RESEND_EMAIL_DOMAIN
        ? `مستر جيشو <noreply@${process.env.RESEND_EMAIL_DOMAIN}>`
        : 'مستر جيشو <onboarding@resend.dev>'
      const { error } = await resend.emails.send({
        from,
        to: [user.email],
        subject: 'استعادة كلمة المرور — مستر جيشو',
        html: `<div dir="rtl" style="font-family:Arial,sans-serif"><h2>استعادة كلمة المرور</h2><p>اضغط على الرابط التالي لتعيين كلمة مرور جديدة:</p><p><a href="${url}">تعيين كلمة مرور جديدة</a></p><p>إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.</p></div>`,
      }, { idempotencyKey: `password-reset/${user.id}` })
      if (error) console.error('[v0] Failed to send password reset email:', error.message)
    },
  },
  ...(process.env.NODE_ENV === 'development' ? { advanced: { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } } } : {}),
})

