import Link from "next/link";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-muted/20">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
          <span>مستر جيشو</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground" aria-label="روابط التذييل">
          <Link href="/projects" className="hover:text-foreground">المشاريع</Link>
          <Link href="/control-plane/providers" className="hover:text-foreground">المزودون</Link>
          <Link href="/runtime-health" className="hover:text-foreground">حالة النظام</Link>
          <Link href="/about" className="hover:text-foreground">عن مستر جيشو</Link>
          <Link href="/pricing" className="hover:text-foreground">الأسعار</Link>
          <Link href="/contact" className="hover:text-foreground">تواصل معنا</Link>
        </nav>
        <p className="text-xs text-muted-foreground">منصة بناء تطبيقات ذكية للمطورين</p>
      </div>
    </footer>
  );
}
