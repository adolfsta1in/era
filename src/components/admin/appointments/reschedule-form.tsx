"use client";

import { CalendarClock, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { rescheduleAppointment } from "@/app/admin/(panel)/appointments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateLong, formatTime } from "@/lib/time";
import { cn } from "@/lib/utils";

type Slot = { start: string };

const ERRORS: Record<string, string> = {
  SLOT_TAKEN: "Это время уже занято — выберите другое",
  NOT_ACTIVE: "Переносить можно только новые и подтверждённые записи",
  DOCTOR: "Этот врач не оказывает эту услугу",
  NOT_FOUND: "Запись не найдена",
  INVALID: "Выберите время",
};

/** Перенос записи: врач (из оказывающих услугу), дата и свободное время. Своё время записи считается свободным. */
export function RescheduleForm({
  appointmentId,
  serviceId,
  doctorId: currentDoctorId,
  date: currentDate,
  today,
  doctors,
}: {
  appointmentId: string;
  serviceId: string;
  doctorId: string;
  date: string;
  today: string;
  doctors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [doctorId, setDoctorId] = useState(currentDoctorId);
  const [date, setDate] = useState(currentDate < today ? today : currentDate);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [start, setStart] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !date) return;
    const controller = new AbortController();
    fetch(`/api/admin/slots?service=${serviceId}&doctor=${doctorId}&date=${date}&exclude=${appointmentId}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d: { slots?: Slot[] }) => {
        setSlots(d.slots ?? []);
        setStart("");
      })
      .catch(() => {});
    return () => controller.abort();
  }, [open, serviceId, doctorId, date, appointmentId]);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <CalendarClock /> Перенести
      </Button>
    );
  }

  function submit() {
    if (!start) return toast.error("Выберите новое время");
    startTransition(async () => {
      const res = await rescheduleAppointment({ id: appointmentId, start, doctorId });
      if (res.ok) {
        toast.success(`Перенесено на ${formatDateLong(new Date(res.start), "ru")}, ${formatTime(new Date(res.start))}`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(ERRORS[res.error] ?? "Не удалось перенести запись");
        // Время могли занять, пока админ выбирал, — обновляем список свободных окон.
        setSlots(null);
        setStart("");
        fetch(`/api/admin/slots?service=${serviceId}&doctor=${doctorId}&date=${date}&exclude=${appointmentId}`)
          .then((r) => r.json())
          .then((d: { slots?: Slot[] }) => setSlots(d.slots ?? []))
          .catch(() => {});
      }
    });
  }

  const label = "mb-1.5 block text-sm font-semibold text-ink";
  return (
    <section aria-labelledby="reschedule-h" className="w-full rounded-2xl border bg-muted/30 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id="reschedule-h" className="font-bold">
          Перенос записи
        </h2>
        <Button variant="ghost" size="icon" aria-label="Закрыть" onClick={() => setOpen(false)}>
          <X />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className={label}>Врач</span>
          <Select
            value={doctorId}
            onValueChange={(v) => {
              setDoctorId(v);
              setSlots(null);
            }}
          >
            <SelectTrigger aria-label="Врач" className="h-11 w-full rounded-xl bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="rs-date" className={label}>
            Новая дата
          </label>
          <Input id="rs-date" type="date" min={today} value={date} onChange={(e) => {
              setDate(e.target.value);
              setSlots(null);
            }}
            className="bg-card"
          />
        </div>
      </div>
      <div className="mt-4">
        <span className={label}>Новое время</span>
        {slots === null ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Загрузка…
          </p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">На эту дату свободного времени нет</p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
            {slots.map((s) => (
              <button
                key={s.start}
                type="button"
                aria-pressed={start === s.start}
                onClick={() => setStart(s.start)}
                className={cn(
                  "h-10 rounded-xl border text-sm font-semibold tabular-nums transition-colors hover:border-primary",
                  start === s.start ? "border-primary bg-primary text-primary-foreground" : "bg-card text-ink",
                )}
              >
                {formatTime(new Date(s.start))}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Отмена
        </Button>
        <Button onClick={submit} disabled={pending || !start}>
          {pending && <Loader2 className="animate-spin" />} Перенести
        </Button>
      </div>
    </section>
  );
}
