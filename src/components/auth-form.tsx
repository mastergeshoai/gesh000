'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password' }) {
  const router = useRouter()
  const params = useSearchParams()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const isReset = mode === 'reset-password'
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setMessage(''); setLoading(true)
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') || '')
    const password = String(data.get('password') || '')
    let result: { error?: { message?: string } | null } | undefined
    if (mode === 'forgot-password') result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/reset-password` })
    else if (isReset) result = await authClient.resetPassword({ newPassword: password, token: params.get('token') || '' })
    else if (mode === 'sign-up') result = await authClient.signUp.email({ email, password, name: String(data.get('name') || '') })
    else result = await authClient.signIn.email({ email, password })
    setLoading(false)
    if (result?.error) { console.error('[v0] Authentication request failed:', result.error.message); setError('تعذر إتمام العملية. تحقق من البيانات وحاول مجددًا.'); return }
    if (mode === 'forgot-password') { setMessage('إذا كان البريد مسجلًا، ستصلك رسالة تحتوي على رابط الاستعادة.'); return }
    if (isReset) { setMessage('تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.'); setTimeout(() => router.push('/sign-in'), 900); return }
    router.push('/projects'); router.refresh()
  }
  const title = mode === 'sign-in' ? 'مرحبًا بعودتك' : mode === 'sign-up' ? 'أنشئ حسابك' : mode === 'forgot-password' ? 'استعادة كلمة المرور' : 'تعيين كلمة مرور جديدة'
  return <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
    <div><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{mode === 'forgot-password' ? 'أدخل بريدك الإلكتروني لنرسل لك رابط الاستعادة.' : 'دخول آمن إلى مساحة بناء التطبيقات.'}</p></div>
    {mode === 'sign-up' && <label className="flex flex-col gap-2 text-sm">الاسم<input name="name" required className="rounded-lg border border-input bg-background px-3 py-2" /></label>}
    {mode !== 'reset-password' && <label className="flex flex-col gap-2 text-sm">البريد الإلكتروني<input name="email" type="email" required className="rounded-lg border border-input bg-background px-3 py-2" /></label>}
    {mode !== 'forgot-password' && <label className="flex flex-col gap-2 text-sm">كلمة المرور<input name="password" type="password" minLength={8} required className="rounded-lg border border-input bg-background px-3 py-2" /></label>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-primary">{message}</p>}
    <button disabled={loading} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50">{loading ? 'جارٍ المعالجة...' : mode === 'forgot-password' ? 'إرسال رابط الاستعادة' : isReset ? 'حفظ كلمة المرور' : mode === 'sign-in' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
    {mode === 'sign-in' && <div className="flex justify-between text-sm"><a href="/sign-up" className="text-primary hover:underline">إنشاء حساب جديد</a><a href="/forgot-password" className="text-muted-foreground hover:underline">نسيت كلمة المرور؟</a></div>}
    {mode === 'sign-up' && <a href="/sign-in" className="text-center text-sm text-primary hover:underline">لديك حساب؟ تسجيل الدخول</a>}
  </form>
}
