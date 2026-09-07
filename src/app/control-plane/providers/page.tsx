import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAccessError, requireAdmin } from "@/lib/admin";
import { availableProviderAdapters, listProviders } from "@/lib/control-plane/service";
import { ProvidersManager } from "@/components/providers-manager";

export default async function ProvidersPage() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError && error.status === 401) redirect("/sign-in");
    if (!(error instanceof AdminAccessError)) throw error;
    return (
      <section className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-16">
        <h1 className="text-balance text-2xl font-semibold">ليس لديك صلاحية الوصول</h1>
        <p className="text-muted-foreground">إدارة المزودين متاحة للمدير العام فقط.</p>
        <Link href="/projects" className="text-primary underline underline-offset-4">العودة إلى المشاريع</Link>
      </section>
    );
  }
  const providers = await listProviders(admin.id);
  return <ProvidersManager catalog={{ providers, available: availableProviderAdapters() }} />;
}
