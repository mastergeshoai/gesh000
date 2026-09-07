"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/projects", label: "المشاريع" },
  { href: "/control-plane/providers", label: "المزودون", adminOnly: true },
  { href: "/runtime-health", label: "حالة النظام" },
  { href: "/pricing", label: "الاشتراكات" },
  { href: "/account", label: "الحساب" },
];

export function SiteHeader({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const visibleLinks = links.filter((link) => !link.adminOnly || isAdmin);
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <header className="sticky top-0 z-40 bg-background/95 text-foreground">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="VibeBuild - الصفحة الرئيسية">
          <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight">VibeBuild</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {visibleLinks.map((link) => (
            <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined} className="rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && <span className="hidden text-sm text-muted-foreground sm:inline">المدير العام</span>}
          {!isPending && !session && <Button asChild variant="ghost" size="sm"><Link href="/sign-in">تسجيل الدخول</Link></Button>}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="فتح القائمة">
                <Menu data-icon="inline-start" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>القائمة الرئيسية</SheetTitle>
                <SheetDescription>انتقل بين صفحات VibeBuild</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-2 px-4" aria-label="التنقل للجوال">
                {visibleLinks.map((link) => (
                  <Link key={link.href} href={link.href} aria-current={isActive(link.href) ? "page" : undefined} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground aria-[current=page]:bg-accent aria-[current=page]:text-accent-foreground">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
