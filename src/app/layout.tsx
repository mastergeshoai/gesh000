// src/app/layout.tsx
import React from "react";
import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { ScriptExecutor } from "@/components/ScriptExecutor";
import { GlobalErrorCatcher } from "@/components/GlobalErrorCatcher";
import { Toaster } from "@/components/ui/sonner";
import { InsufficientCreditsModal } from "@/components/workspace/InsufficientCreditsModal";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const notoArabic = Noto_Sans_Arabic({ variable: "--font-noto-arabic", subsets: ["arabic"], weight: ["400", "500", "600", "700"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "مستر جيشو — ابنِ تطبيقك بالذكاء الاصطناعي",
  description: "منصة عربية لبناء التطبيقات بالذكاء الاصطناعي، إدارة المشاريع، المزودين، ومراقبة حالة النظام.",
};

// SUPER IMPORTANT: NOT EDIT THE FOLLOWING 2 LINES TO FORCE NEXT.JS TO RENDER DYNAMICALLY
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${notoArabic.variable} ${geistMono.variable} antialiased`}>
        <GlobalErrorCatcher />
        <ScriptExecutor />
        <Toaster position="top-right" richColors />
        {/*
          ⭐ MOUNTED ONCE FOR THE WHOLE APP. Running out of credits can happen on any
          screen — the dashboard creating a project, the workspace publishing one — and
          the modal listens for the event the VCaaS client raises rather than being wired
          per page. See `InsufficientCreditsModal`.
        */}
        <InsufficientCreditsModal />
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
