"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActivityIcon, KeyIcon, LoaderIcon, PlusIcon, RefreshCwIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CredentialView {
  id: string;
  label: string;
  masked: string;
  status: string;
  lastRotatedAt: string | null;
  createdAt: string;
}

export type HealthView = {
  state: string;
  latencyMs: number | null;
  checkedAt: string;
} | null;

const HEALTH_LABELS: Record<string, string> = {
  healthy: "سليم",
  unhealthy: "متوقف",
  degraded: "متدهور",
  unknown: "غير مفحوص",
};

const HEALTH_CLASSES: Record<string, string> = {
  healthy: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  unhealthy: "border-destructive/40 bg-destructive/10 text-destructive",
  degraded: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  unknown: "border-border bg-muted text-muted-foreground",
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  return `قبل ${Math.round(hours / 24)} يوم`;
}

export function ProviderCard({
  provider,
  credentials: initialCredentials,
  health: initialHealth,
}: {
  provider: { id: string; name: string; slug: string; status: string };
  credentials: CredentialView[];
  health: HealthView;
}) {
  const router = useRouter();
  const [credentials, setCredentials] = useState(initialCredentials);
  const [health, setHealth] = useState(initialHealth);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  // Add-credential form
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState("");
  const [secret, setSecret] = useState("");

  // Rotate form (one credential at a time)
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState("");

  async function call(path: string, init: RequestInit, key: string): Promise<unknown | null> {
    setBusy(key);
    setError("");
    try {
      const response = await fetch(path, init);
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const messages: Record<number, string> = {
          401: "انتهت الجلسة أو لا تملك صلاحية المدير.",
          404: "العنصر غير موجود — حدّث الصفحة.",
          409: "يوجد مفتاح بنفس الاسم بالفعل. اختر اسمًا آخر.",
        };
        setError(messages[response.status] ?? "تعذّرت العملية. حاول مرة أخرى.");
        return null;
      }
      return body;
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function refreshCredentials() {
    const body = await call(`/api/control-plane/providers/${provider.id}/credentials`, {}, "refresh");
    if (body && typeof body === "object" && "credentials" in body) {
      setCredentials((body as { credentials: CredentialView[] }).credentials);
    }
  }

  async function runHealthCheck() {
    const body = await call(`/api/control-plane/providers/${provider.id}/health`, { method: "POST" }, "health");
    if (body && typeof body === "object" && "health" in body) {
      setHealth((body as { health: HealthView }).health);
      router.refresh();
    }
  }

  async function addCredential() {
    if (!label.trim() || secret.length < 8) {
      setError("الاسم مطلوب والمفتاح يجب أن يكون 8 أحرف على الأقل.");
      return;
    }
    const body = await call(
      `/api/control-plane/providers/${provider.id}/credentials`,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label: label.trim(), secret }) },
      "add",
    );
    if (body) {
      setLabel("");
      setSecret("");
      setShowAdd(false);
      await refreshCredentials();
    }
  }

  async function rotateCredential(credentialId: string) {
    if (newSecret.length < 8) {
      setError("المفتاح الجديد يجب أن يكون 8 أحرف على الأقل.");
      return;
    }
    const body = await call(
      `/api/control-plane/credentials/${credentialId}`,
      { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ secret: newSecret }) },
      `rotate:${credentialId}`,
    );
    if (body) {
      setRotatingId(null);
      setNewSecret("");
      await refreshCredentials();
    }
  }

  async function revokeCredential(credentialId: string) {
    const body = await call(`/api/control-plane/credentials/${credentialId}`, { method: "DELETE" }, `revoke:${credentialId}`);
    if (body) await refreshCredentials();
  }

  const healthState = health?.state ?? "unknown";

  return (
    <article className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{provider.name}</h3>
          <p className="font-mono text-sm text-muted-foreground">{provider.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-0.5 text-xs ${HEALTH_CLASSES[healthState] ?? HEALTH_CLASSES.unknown}`}>
            <ActivityIcon className="me-1 inline size-3" aria-hidden />
            {HEALTH_LABELS[healthState] ?? healthState}
          </span>
          <span className="text-xs text-muted-foreground">
            {provider.status === "disabled" ? "معطّل" : provider.status === "degraded" ? "متدهور" : "مفعّل"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/40 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          {health
            ? `آخر فحص ${relativeTime(health.checkedAt)}${health.latencyMs != null ? ` — زمن الاستجابة ${health.latencyMs} مللي ثانية` : ""}`
            : "لم يُفحص هذا المزود بعد."}
        </p>
        <Button variant="outline" size="sm" onClick={() => void runHealthCheck()} disabled={busy === "health"}>
          {busy === "health" ? <LoaderIcon className="size-4 animate-spin" aria-hidden /> : <ActivityIcon className="size-4" aria-hidden />}
          فحص الآن
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-sm font-medium">
            <KeyIcon className="size-4 text-muted-foreground" aria-hidden />
            مفاتيح الوصول
          </h4>
          <Button variant="outline" size="sm" onClick={() => { setShowAdd((v) => !v); setError(""); }} disabled={busy === "add"}>
            <PlusIcon className="size-4" aria-hidden />
            {showAdd ? "إلغاء" : "إضافة مفتاح"}
          </Button>
        </div>

        {showAdd && (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-background/40 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`label-${provider.id}`} className="text-xs">اسم المفتاح</Label>
                <Input id={`label-${provider.id}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="مثال: production-key" maxLength={60} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`secret-${provider.id}`} className="text-xs">المفتاح</Label>
                <Input id={`secret-${provider.id}`} type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="يُخزَّن مشفّرًا ولن يُعرض مرة أخرى" maxLength={512} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => void addCredential()} disabled={busy === "add"}>
                {busy === "add" && <LoaderIcon className="size-4 animate-spin" aria-hidden />}
                حفظ المفتاح
              </Button>
            </div>
          </div>
        )}

        {credentials.length ? credentials.map((credential) => (
          <div key={credential.id} className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">{credential.label}</p>
                <p className="font-mono text-xs text-muted-foreground">{credential.masked}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {credential.status === "active" ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => { setRotatingId(rotatingId === credential.id ? null : credential.id); setError(""); }} disabled={busy !== null}>
                      <RefreshCwIcon className="size-3.5" aria-hidden />
                      تدوير
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => void revokeCredential(credential.id)} disabled={busy !== null}>
                      {busy === `revoke:${credential.id}` ? <LoaderIcon className="size-3.5 animate-spin" aria-hidden /> : <XIcon className="size-3.5" aria-hidden />}
                      إلغاء
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">ملغى</span>
                )}
              </div>
            </div>
            {rotatingId === credential.id && (
              <div className="flex flex-col gap-2 rounded-md border border-border bg-background/40 p-2.5 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor={`rotate-${credential.id}`} className="text-xs">المفتاح الجديد</Label>
                  <Input id={`rotate-${credential.id}`} type="password" value={newSecret} onChange={(e) => setNewSecret(e.target.value)} placeholder="استبدل المفتاح القديم فورًا" maxLength={512} />
                </div>
                <Button size="sm" onClick={() => void rotateCredential(credential.id)} disabled={busy === `rotate:${credential.id}`}>
                  {busy === `rotate:${credential.id}` && <LoaderIcon className="size-4 animate-spin" aria-hidden />}
                  تأكيد التدوير
                </Button>
              </div>
            )}
          </div>
        )) : (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">لا توجد مفاتيح مسجلة لهذا المزود.</p>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </article>
  );
}
