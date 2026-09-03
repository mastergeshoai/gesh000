"use client";

import { useEffect, useState } from "react";

type Provider = { id: string; name: string; slug: string; status: string; capabilities: string[] };
type Catalog = { providers: Provider[]; available: Array<{ slug: string; name: string; adapterKey: string; capabilities: Record<string, boolean> }> };

export default function ProvidersPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/control-plane/providers", { cache: "no-store" });
    if (!response.ok) { setError("لا يمكن تحميل سجل المزودين"); return; }
    setCatalog(await response.json());
  }
  useEffect(() => { void load(); }, []);

  async function addProvider(item: NonNullable<Catalog>["available"][number]) {
    setBusy(true); setError("");
    const response = await fetch("/api/control-plane/providers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(item) });
    if (!response.ok) setError("تعذر إضافة المزود"); else await load();
    setBusy(false);
  }

  return <main className="min-h-screen bg-background p-6 text-foreground md:p-10" dir="rtl">
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2"><p className="font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">Control Plane / Registry</p><h1 className="text-3xl font-semibold tracking-tight">سجل مزودي الذكاء الاصطناعي</h1><p className="max-w-2xl text-muted-foreground">إدارة المزودين المسجلين من الخادم. لا يتم عرض أو تخزين مفاتيح الوصول في هذه الواجهة.</p></header>
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <section className="grid gap-4 md:grid-cols-2">{catalog?.available.map((item) => <article key={item.slug} className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-medium">{item.name}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">{item.adapterKey}</p></div><span className="rounded-full bg-muted px-2 py-1 text-xs">متاح</span></div><p className="mt-5 text-sm text-muted-foreground">{Object.keys(item.capabilities).filter((key) => item.capabilities[key]).join(" · ")}</p><button disabled={busy || catalog.providers.some((provider) => provider.slug === item.slug)} onClick={() => void addProvider(item)} className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{catalog.providers.some((provider) => provider.slug === item.slug) ? "مضاف" : "إضافة إلى السجل"}</button></article>)}</section>
      <section className="space-y-3"><h2 className="text-lg font-medium">المزودون المسجلون</h2>{catalog?.providers.length ? catalog.providers.map((provider) => <div key={provider.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4"><div><p className="font-medium">{provider.name}</p><p className="font-mono text-xs text-muted-foreground">{provider.slug}</p></div><span className="text-sm text-muted-foreground">{provider.status}</span></div>) : <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">لا يوجد مزودون مسجلون بعد.</p>}</section>
    </div>
  </main>;
}
