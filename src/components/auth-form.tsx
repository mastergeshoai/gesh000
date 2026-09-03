'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter(); const [error, setError] = useState(''); const [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true)
    const data = new FormData(event.currentTarget); const email = String(data.get('email')); const password = String(data.get('password')); const name = String(data.get('name') || '')
    const result = mode === 'sign-up' ? await authClient.signUp.email({ email, password, name }) : await authClient.signIn.email({ email, password })
    setLoading(false); if (result.error) { setError('تعذر إتمام العملية. تحقق من البيانات وحاول مجددًا.'); return }; router.push('/'); router.refresh()
  }
  return <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xl">
    <div><h1 className="text-2xl font-semibold">{mode === 'sign-in' ? 'مرحبًا بعودتك' : 'أنشئ حسابك'}</h1><p className="mt-2 text-sm text-muted-foreground">دخول آمن إلى مساحة بناء التطبيقات.</p></div>
    {mode === 'sign-up' && <label className="flex flex-col gap-2 text-sm">الاسم<input name="name" required className="rounded-lg border border-input bg-background px-3 py-2" /></label>}
    <label className="flex flex-col gap-2 text-sm">البريد الإلكتروني<input name="email" type="email" required className="rounded-lg border border-input bg-background px-3 py-2" /></label>
    <label className="flex flex-col gap-2 text-sm">كلمة المرور<input name="password" type="password" minLength={8} required className="rounded-lg border border-input bg-background px-3 py-2" /></label>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button disabled={loading} className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50">{loading ? 'جارٍ المعالجة...' : mode === 'sign-in' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
  </form>
}
