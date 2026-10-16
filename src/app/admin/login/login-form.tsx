"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, type LoginState } from "../actions";

const MESSAGES = {
  invalid: "Неверный пароль",
  rate: "Слишком много попыток. Подождите 15 минут.",
  config: "Не задан SESSION_SECRET в настройках сервера",
};

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold">
          Пароль
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? "login-error" : undefined}
        />
        {state.error && (
          <p id="login-error" role="alert" className="mt-2 text-sm text-destructive">
            {MESSAGES[state.error]}
          </p>
        )}
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Войти
      </Button>
    </form>
  );
}
