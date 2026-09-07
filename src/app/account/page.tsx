import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserRound, ShieldCheck, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { AccountSettings } from "@/components/account-settings";
import { getTotalumKeyStatus } from "@/app/account/actions";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in?callbackUrl=/account");
  const user = session.user as typeof session.user & { language?: string; timezone?: string };
  const totalum = await getTotalumKeyStatus();
  return <section className="mx-auto max-w-5xl px-4 pb-20 pt-16 sm:px-6 lg:px-8"><div className="flex flex-col gap-3 pb-8"><Badge variant="secondary" className="w-fit">مساحتك الشخصية</Badge><h1 className="text-4xl font-bold text-balance">الحساب والإعدادات</h1><p className="text-muted-foreground">أدر ملفك الشخصي وأمان حسابك واشتراكك من مكان واحد.</p></div><AccountSettings user={{ name: user.name, email: user.email, language: user.language || "ar", timezone: user.timezone || "Africa/Cairo" }} totalumConfigured={totalum.configured} totalumMasked={totalum.masked} /></section>;
}
