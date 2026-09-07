"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ProviderDescriptor } from "@/lib/control-plane/types";

type Catalog = {
  providers: Array<{ id: string; name: string; slug: string; status: string }>;
  available: ProviderDescriptor[];
};

export function ProvidersManager({ catalog }: { catalog: Catalog }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, startTransition] = useTransition();

  async function addProvider(item: ProviderDescriptor) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/control-plane/providers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        setError(response.status === 401 || response.status === 403 ? "انتهت الجلسة أو لا تملك صلاحية المدير." : "تعذر إضافة المزود. حاول مرة أخرى.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">لوحة تحكم المدير العام</p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight">سجل مزودي الذكاء الاصطناعي</h1>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">إدارة المزودين المسجلين من الخادم. لا يتم عرض أو تخزين مفاتيح الوصول في هذه الواجهة.</p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {catalog.available.map((item) => {
          const added = catalog.providers.some((provider) => provider.slug === item.slug);
          return (
            <article key={item.slug} className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground">
              <div><h2 className="font-medium">{item.name}</h2><p className="font-mono text-sm text-muted-foreground">{item.adapterKey}</p></div>
              <p className="text-sm text-muted-foreground">{Object.keys(item.capabilities).filter((key) => item.capabilities[key]).join(" · ")}</p>
              <Button disabled={busy || refreshing || added} onClick={() => void addProvider(item)}>{added ? "مضاف" : busy || refreshing ? "جارٍ التحديث…" : "إضافة إلى السجل"}</Button>
            </article>
          );
        })}
      </div>
      <div className="flex flex-col gap-3" aria-live="polite">
        <h2 className="text-lg font-medium">المزودون المسجلون</h2>
        {catalog.providers.length ? catalog.providers.map((provider) => (
          <div key={provider.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 text-card-foreground">
            <div><p className="font-medium">{provider.name}</p><p className="font-mono text-sm text-muted-foreground">{provider.slug}</p></div>
            <span className="text-sm text-muted-foreground">{provider.status === "disabled" ? "معطّل" : provider.status}</span>
          </div>
        )) : <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">لا يوجد مزودون مسجلون بعد.</p>}
      </div>
    </section>
  );
}
