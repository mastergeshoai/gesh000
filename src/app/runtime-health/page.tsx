"use client";

import { useEffect, useState } from "react";

type Health = { ok: boolean; browser: { executable: string | null; available: boolean }; libraries: Record<string, boolean>; missing: string[]; checkedAt: string };

export default function RuntimeHealthPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/runtime/health", { cache: "no-store" }).then((r) => r.json()).then(setHealth).finally(() => setLoading(false)); }, []);
  return <main className="min-h-screen bg-background px-6 py-16 text-foreground"><div className="mx-auto max-w-3xl space-y-8"><header><p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">Runtime diagnostics</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Browser runtime health</h1><p className="mt-3 max-w-xl leading-6 text-muted-foreground">تحقق من جاهزية Chromium والمكتبات المطلوبة قبل تشغيل اختبارات المتصفح أو مهام المعاينة.</p></header><section className="rounded-2xl border border-border bg-card p-6 shadow-sm"><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-medium">الحالة الحالية</h2><span className={health?.ok ? "rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-600" : "rounded-full bg-destructive/15 px-3 py-1 text-sm text-destructive"}>{loading ? "جارٍ الفحص" : health?.ok ? "جاهز" : "يحتاج إصلاحًا"}</span></div>{health && <div className="mt-6 grid gap-3 sm:grid-cols-2">{Object.entries({ Chromium: health.browser.available, ...health.libraries }).map(([name, value]) => <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3" key={name}><span className="font-mono text-sm">{name}</span><span className={value ? "text-emerald-600" : "text-destructive"}>{value ? "متوفر" : "مفقود"}</span></div>)}</div>} {!loading && health?.missing.length ? <p className="mt-5 rounded-xl bg-muted p-4 text-sm leading-6">المكتبات المفقودة: {health.missing.join(", ")}. ثبّت حزم النظام داخل صورة التشغيل ثم أعد الفحص.</p> : null}</section></div></main>;
}
