"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IMaskInput } from "react-imask";
import { toast } from "sonner";
import { adminCreateAppointment } from "@/app/admin/(panel)/appointments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateLong, formatDateShort, formatTime, toDateKey } from "@/lib/time";
import { cn } from "@/lib/utils";
import { isBlankPhone, normalizeKgPhone } from "@/lib/validators/phone";

type Option = { id: string; name: string };
type ServiceOption = Option & { doctorIds: string[]; durationMin: number };
type Slot = { start: string; doctorIds: string[] };

export function NewAppointmentForm({
  services,
  doctors,
  today,
}: {
  services: ServiceOption[];
  doctors: Option[];
  today: string;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState("");
  const [doctorId, setDoctorId] = useState("any");
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [start, setStart] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"NEW" | "CONFIRMED">("CONFIRMED");
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const service = services.find((s) => s.id === serviceId);
  const serviceDoctors = service ? doctors.filter((d) => service.doctorIds.includes(d.id)) : [];

  useEffect(() => {
    if (!serviceId || !date) return;
    const controller = new AbortController();
    fetch(`/api/admin/slots?service=${serviceId}&doctor=${doctorId}&date=${date}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { slots?: Slot[] }) => {
        setSlots(d.slots ?? []);
        setStart("");
      })
      .catch(() => {});
    return () => controller.abort();
  }, [serviceId, doctorId, date]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!serviceId) errs.service = "Выберите услугу";
    if (!start) errs.start = "Выберите время";
    if (name.trim().length < 2) errs.name = "Укажите имя";
    if (!isBlankPhone(phone) && !normalizeKgPhone(phone)) errs.phone = "Номер полностью: +996 XXX XXX XXX — или оставьте пустым";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    startTransition(async () => {
      const res = await adminCreateAppointment({ serviceId, doctorId, start, name, phone, comment, status });
      if (res.ok) {
        toast.success(`Записано: ${res.booking.code}`);
        router.push(`/admin/appointments?q=${res.booking.code}`);
      } else if (res.error === "SLOT_TAKEN") {
        toast.error("Это время уже заняли — выберите другое");
        setSlots(res.alternatives.map((a) => ({ start: a.start, doctorIds: a.doctorIds })));
        setStart("");
      } else {
        toast.error("Не удалось создать запись. Проверьте данные.");
      }
    });
  }

  const label = "mb-1.5 block text-sm font-semibold text-ink";
  const err = (k: string) => errors[k] && <p className="mt-1.5 text-sm text-destructive">{errors[k]}</p>;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-2">
      <fieldset className="space-y-4 rounded-3xl border bg-card p-5 sm:p-6">
        <legend className="sr-only">Услуга, врач и время</legend>
        <div>
          <span className={label}>Услуга</span>
          <Select
            value={serviceId}
            onValueChange={(v) => {
              setServiceId(v);
              setDoctorId("any");
            }}
          >
            <SelectTrigger aria-label="Услуга" className="h-11 w-full rounded-xl">
              <SelectValue placeholder="Выберите услугу" />
            </SelectTrigger>
            <SelectContent>
              {services.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} · {s.durationMin} мин
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err("service")}
        </div>
        <div>
          <span className={label}>Врач</span>
          <Select value={doctorId} onValueChange={setDoctorId} disabled={!service}>
            <SelectTrigger aria-label="Врач" className="h-11 w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Любой свободный</SelectItem>
              {serviceDoctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="adm-date" className={label}>
            Дата
          </label>
          <Input id="adm-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <span className={label}>Время</span>
          {!service ? (
            <p className="text-sm text-muted-foreground">Сначала выберите услугу</p>
          ) : slots === null ? (
            <p className="text-sm text-muted-foreground">Загрузка…</p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">На эту дату свободного времени нет</p>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
              {slots.map((s) => {
                return (
                  <button
                    key={s.start}
                    type="button"
                    aria-pressed={start === s.start}
                    onClick={() => setStart(s.start)}
                    title={formatDateLong(new Date(s.start), "ru")}
                    className={cn(
                      "h-10 rounded-xl border text-sm font-semibold tabular-nums transition-colors hover:border-primary",
                      start === s.start ? "border-primary bg-primary text-primary-foreground" : "bg-card text-ink",
                    )}
                  >
                    {toDateKey(new Date(s.start)) === date
                      ? formatTime(new Date(s.start))
                      : `${formatDateShort(new Date(s.start)).slice(0, 5)} ${formatTime(new Date(s.start))}`}
                  </button>
                );
              })}
            </div>
          )}
          {err("start")}
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-3xl border bg-card p-5 sm:p-6">
        <legend className="sr-only">Пациент</legend>
        <div>
          <label htmlFor="adm-name" className={label}>
            Имя пациента
          </label>
          <Input id="adm-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          {err("name")}
        </div>
        <div>
          <label htmlFor="adm-phone" className={label}>
            Телефон <span className="font-normal text-muted-foreground">(необязательно)</span>
          </label>
          <IMaskInput
            id="adm-phone"
            mask="+{996} (000) 000-000"
            lazy={false}
            value={phone}
            onAccept={(v: string) => setPhone(v)}
            inputMode="tel"
            className="h-11 w-full rounded-xl border border-input bg-card px-3.5 tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {err("phone")}
        </div>
        <div>
          <label htmlFor="adm-comment" className={label}>
            Комментарий
          </label>
          <Textarea id="adm-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <div>
          <span className={label}>Статус</span>
          <Select value={status} onValueChange={(v) => setStatus(v as "NEW" | "CONFIRMED")}>
            <SelectTrigger aria-label="Статус" className="h-11 w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONFIRMED">Подтверждена</SelectItem>
              <SelectItem value="NEW">Новая</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <Loader2 className="animate-spin" />} Создать запись
        </Button>
      </fieldset>
    </form>
  );
}
