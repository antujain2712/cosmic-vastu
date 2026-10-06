import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "cvc_admin";

function token() {
  const pw = process.env.ADMIN_PASSWORD || "change-me";
  return crypto.createHmac("sha256", pw).update("cosmic-vastu-admin").digest("hex");
}

export function checkPassword(pw: string) {
  const expected = process.env.ADMIN_PASSWORD || "change-me";
  if (process.env.NODE_ENV === "production" && (expected === "change-me" || expected.length < 10)) return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function setAdminCookie() {
  (await cookies()).set(COOKIE, token(), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function isAdmin() {
  return (await cookies()).get(COOKIE)?.value === token();
}
