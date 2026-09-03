"use client";

import Link from "next/link";
import { Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { href: "/", label: "المشاريع" },
  { href: "/control-plane/providers", label: "المزودون" },
  { href: "/runtime-health", label: "حالة النظام" },
  { href: "/pricing", label: "الاشتراكات" },
  { href: "/account", label: "الحساب" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="مستر جيشو - الصفحة الرئيسية">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles data-icon="inline-start" />
          </span>
          <span className="hidden text-sm font-bold tracking-tight sm:block">مستر جيشو</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="التنقل الرئيسي">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/">إنشاء مشروع</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="فتح القائمة">
                {open ? <X data-icon="inline-start" /> : <Menu data-icon="inline-start" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle>القائمة الرئيسية</SheetTitle>
              <nav className="mt-8 flex flex-col gap-2" aria-label="التنقل للجوال">
                {links.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
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
