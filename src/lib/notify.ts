// Email notifications through Resend (https://resend.com). Without a key, messages are logged.
import { site } from "@/config/site";

export async function sendEmail(to: string | string[], subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[email:demo] to=${to} subject=${subject}`);
    return { demo: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || `${site.brand} <bookings@resend.dev>`,
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) console.error("[email] failed", await res.text());
  return { demo: false, ok: res.ok };
}

export const adminEmail = () => process.env.ADMIN_EMAIL || site.email;
