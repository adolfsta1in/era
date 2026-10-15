import Image from "next/image";
import { cn } from "@/lib/utils";

/** Логотип клиники: загруженный файл из настроек или фирменный знак по умолчанию. */
export function Logo({
  name,
  logoUrl,
  className,
  inverted = false,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
  inverted?: boolean;
}) {
  if (logoUrl) {
    return (
      <span className={cn("flex items-center", className)}>
        <Image
          src={logoUrl}
          alt={name}
          width={160}
          height={40}
          className={cn("h-9 w-auto object-contain", inverted && "brightness-0 invert")}
          priority
        />
      </span>
    );
  }
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="size-9 shrink-0" />
      <span
        className={cn(
          "font-heading text-[1.15rem] leading-none font-extrabold tracking-tight",
          inverted ? "text-primary-foreground" : "text-ink",
        )}
      >
        {name}
      </span>
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="var(--primary)" />
      <path
        d="M14.2 9.6c2-.6 3.8.1 5.8 1 2-.9 3.8-1.6 5.8-1 3.3 1 4.8 4.6 3.9 8.5-.5 2.2-1.5 3.7-2 5.9-.6 2.8-.8 5.7-2 7.7-.8 1.3-2.4 1.1-2.9-.3-.6-1.8-.8-4.6-2.8-4.6s-2.2 2.8-2.8 4.6c-.5 1.4-2.1 1.6-2.9.3-1.2-2-1.4-4.9-2-7.7-.5-2.2-1.5-3.7-2-5.9-.9-3.9.6-7.5 3.9-8.5Z"
        fill="var(--primary-foreground)"
      />
      <path d="M16.5 14.6c1.3.1 2.5.6 3.7 1.3" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
