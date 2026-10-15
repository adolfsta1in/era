"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type Labels = { before: string; after: string; slider: string };
/** Кейс «до/после»: тексты уже на нужном языке, фото — URL (public/ или Vercel Blob). */
export type BeforeAfterItem = { id: string; title: string; description: string; beforeUrl: string; afterUrl: string };

/** Слайдер «до/после». Кейсы добавляет врач в админке → «До и после». */
export function BeforeAfter({ labels, items }: { labels: Labels; items: BeforeAfterItem[] }) {
  const [value, setValue] = useState(50);
  const [active, setActive] = useState(0);
  const id = useId();
  const item = items[active] ?? items[0];
  if (!item) return null;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-start">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border bg-card select-none sm:aspect-[16/10]">
          <Image src={item.afterUrl} alt={`${item.title} — ${labels.after}`} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}>
            <Image src={item.beforeUrl} alt={`${item.title} — ${labels.before}`} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
          </div>
          <div className="pointer-events-none absolute inset-y-0" style={{ left: `${value}%` }} aria-hidden>
            <div className="absolute inset-y-0 -left-px w-0.5 bg-card shadow-[0_0_0_1px_oklch(0_0_0/0.06)]" />
            <div className="absolute top-1/2 -left-5 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card text-ink shadow-lift">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
              </svg>
            </div>
          </div>
          <span className="absolute top-4 left-4 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white">{labels.before}</span>
          <span className="absolute top-4 right-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {labels.after}
          </span>
          <label htmlFor={id} className="sr-only">
            {labels.slider}
          </label>
          <input
            id={id}
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="absolute inset-0 size-full cursor-ew-resize opacity-0"
          />
        </div>
        {item.description && <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{item.description}</p>}
      </div>

      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col" role="tablist" aria-label={labels.slider}>
          {items.map((c, i) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={active === i}
              onClick={() => {
                setActive(i);
                setValue(50);
              }}
              className={cn(
                "shrink-0 rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition-colors",
                active === i ? "border-primary bg-primary-soft text-primary-soft-foreground" : "bg-card text-ink hover:border-input",
              )}
            >
              <span className="mr-2 font-heading text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
              {c.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
