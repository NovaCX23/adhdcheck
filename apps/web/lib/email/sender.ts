import type { EmailMessage } from "./messages";
import { EMAIL_TEXT } from "./strings";

// Sends one email (FR-50) and never throws: an email that cannot go out must not break the action that
// asked for it. Logs the provider's error name only, never the address or the content.

// No domain of our own: Resend's shared test sender. It only delivers to the address the Resend account was
// made with, which is enough for the demo. With a verified domain, change this one line.
export const EMAIL_FROM = `${EMAIL_TEXT.senderName} <onboarding@resend.dev>`;

export type EmailResult = "sent" | "skipped" | "failed";

export interface EmailSender {
  // idempotencyKey: the provider sends the same key only once (24 hours at Resend), so a repeated call
  // or a double click does not send twice.
  send(input: { to: string; message: EmailMessage; idempotencyKey: string }): Promise<EmailResult>;
}

type ProviderError = { name: string; message: string; statusCode: number | null };
export type EmailTransport = (
  payload: { from: string; to: string[]; subject: string; text: string; html: string },
  options: { idempotencyKey: string },
) => Promise<{ data: unknown; error: ProviderError | null }>;

// Worth a second try: rate limits, provider faults and a network failure. Anything else (a refused
// recipient, a bad key) will fail the same way again.
const TRANSIENT = new Set(["rate_limit_exceeded", "internal_server_error", "application_error", "concurrent_idempotent_requests", "network"]);
const BACKOFF_MS = [500, 1500];

export function createEmailSender(
  transport: EmailTransport | null,
  { sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) } = {},
): EmailSender {
  return {
    async send({ to, message, idempotencyKey }) {
      if (!transport) {
        console.warn("[email] skipped", { error: "email_not_configured" });
        return "skipped";
      }
      for (let attempt = 0; ; attempt++) {
        let name: string;
        try {
          const { error } = await transport({ from: EMAIL_FROM, to: [to], ...message }, { idempotencyKey });
          if (!error) return "sent";
          name = error.name;
        } catch {
          name = "network";
        }
        if (!TRANSIENT.has(name) || attempt >= BACKOFF_MS.length) {
          console.error("[email] failed", { error: name });
          return "failed";
        }
        await sleep(BACKOFF_MS[attempt]);
      }
    },
  };
}
