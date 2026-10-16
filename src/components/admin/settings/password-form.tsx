"use client";

import { KeyRound } from "lucide-react";
import { useActionState, useRef } from "react";
import { changePassword } from "@/app/admin/(panel)/settings/password-actions";
import { Input } from "@/components/ui/input";
import type { FormState } from "@/lib/admin/form";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password-rules";
import { Field, Section, SubmitButton, useFormToast } from "../form-ui";

/** Смена пароля админки — отдельная форма в «Настройках». */
export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await changePassword(prev, fd);
    if (res.ok) formRef.current?.reset();
    return res;
  }, {});
  useFormToast(state);
  const e = state.errors ?? {};

  return (
    <Section
      title="Пароль админки"
      description="Один пароль для входа с компьютера, телефона и программы на ПК. После смены на этом устройстве вход сохранится, на остальных нужно будет войти заново."
    >
      <form ref={formRef} action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Текущий пароль" htmlFor="currentPassword" error={e.currentPassword}>
            <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
          </Field>
          <Field label="Новый пароль" htmlFor="newPassword" error={e.newPassword} hint={`Минимум ${MIN_PASSWORD_LENGTH} символов`}>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </Field>
          <Field label="Повторите новый" htmlFor="repeatPassword" error={e.repeatPassword}>
            <Input id="repeatPassword" name="repeatPassword" type="password" autoComplete="new-password" required />
          </Field>
        </div>
        <div className="flex justify-end">
          <SubmitButton>
            <KeyRound /> Сменить пароль
          </SubmitButton>
        </div>
      </form>
    </Section>
  );
}
