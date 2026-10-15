import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { DoctorAvatar } from "./doctor-avatar";

export type DoctorCardData = {
  slug: string;
  name: string;
  specialty: string;
  experience: string;
  photoUrl: string | null;
  photoAlt: string;
};

export function DoctorCard({ doctor, className, priority }: { doctor: DoctorCardData; className?: string; priority?: boolean }) {
  return (
    <Link href={`/vrachi/${doctor.slug}`} className={cn("group block rounded-3xl", className)}>
      <DoctorAvatar
        name={doctor.name}
        photoUrl={doctor.photoUrl}
        seed={doctor.slug}
        alt={doctor.photoAlt}
        priority={priority}
        className="aspect-[4/5] rounded-3xl transition-transform duration-500 group-hover:scale-[0.985]"
      />
      <div className="mt-4 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <h3 className="text-lg font-bold">{doctor.name}</h3>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{doctor.specialty}</p>
          {doctor.experience && (
            <p className="mt-2 inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-soft-foreground">
              {doctor.experience}
            </p>
          )}
        </div>
        <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border bg-card text-ink transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowUpRight className="size-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
