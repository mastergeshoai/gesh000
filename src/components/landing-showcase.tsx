import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

const projects = [
  { title: "لوحة تحليلات الأعمال", type: "منصة SaaS", image: "/projects/project-dashboard.png" },
  { title: "متجر نُخبة", type: "تجارة إلكترونية", image: "/projects/project-store.png" },
  { title: "أكاديمية خطوة", type: "تعليم إلكتروني", image: "/projects/project-learning.png" },
];

export function LandingShowcase() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <section className="grid items-center gap-10 py-12 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles data-icon="inline-start" /> مساحة أفكارك تبدأ هنا</div>
          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">حوّل فكرتك إلى منتج رقمي يليق بها</h1>
          <p className="max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">مستر جيشو يساعدك على بناء تطبيقات جميلة وذكية باللغة العربية. اكتب ما تتخيله، ودع أدواتنا تتولى التفاصيل التقنية.</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/projects" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90">ابدأ مشروعك الآن <ArrowLeft data-icon="inline-end" /></Link>
            <Link href="/about" className="inline-flex items-center rounded-lg border border-border px-5 py-3 font-semibold transition hover:bg-accent">اكتشف المنصة</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-3 shadow-2xl"><img src="/projects/project-dashboard.png" alt="مثال على لوحة تحليلات مبنية بالمنصة" className="aspect-[16/10] w-full rounded-xl object-cover" /></div>
      </section>
      <section className="flex flex-col gap-8 py-12"><div><p className="text-sm font-semibold text-primary">نماذج من الإبداع</p><h2 className="mt-2 text-3xl font-bold">مشاريع بدأت بفكرة</h2></div><div className="grid gap-5 md:grid-cols-3">{projects.map((project) => <article key={project.title} className="overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-xl"><img src={project.image} alt={project.title} className="aspect-[16/10] w-full object-cover" /><div className="flex flex-col gap-1 p-5"><h3 className="font-bold">{project.title}</h3><p className="text-sm text-muted-foreground">{project.type}</p></div></article>)}</div></section>
    </div>
  );
}
