export type FormState =
  | {
      ok?: boolean;
      error?: string;
      field?: string;
      message?: string;
      /** A generated password, shown to the admin exactly once. */
      secret?: { login: string; password: string; name: string };
      /** Demo credentials created by the setup page, shown once. */
      credentials?: { name: string; login: string; role: string; password: string }[];
      /** Non-secret fields as submitted, so a form keeps them after a failed submit. */
      values?: Record<string, string>;
      /** Changes on every submit so the client can react to repeated results. */
      at?: number;
    }
  | undefined;

export const fail = (error: string, field?: string): FormState => ({ error, field, at: Date.now() });
export const done = (message: string, extra: Omit<NonNullable<FormState>, "ok" | "message"> = {}): FormState => ({
  ok: true,
  message,
  at: Date.now(),
  ...extra,
});
