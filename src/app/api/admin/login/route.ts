import { NextResponse } from "next/server";
import { checkPassword, setAdminCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!checkPassword(String(password ?? ""))) return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
