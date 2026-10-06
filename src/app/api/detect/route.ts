import { NextResponse } from "next/server";
import { saveUpload, allow } from "@/lib/db";
import { detectRooms } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  // per-IP limit so free room detection can't be abused
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!(await allow(`detect:${ip}`, 5, 3600000))) {
    return NextResponse.json({ error: "Room detection is limited to 5 tries an hour. Add rooms by hand below." }, { status: 429 });
  }

  const { image, northAt, propertyType } = await req.json();
  const name = await saveUpload(image);
  if (!name) return NextResponse.json({ error: "Upload a PNG, JPG or WebP under 6 MB." }, { status: 400 });
  try {
    const out = await detectRooms([name], northAt ?? "top", propertyType ?? "home");
    return NextResponse.json(out);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Couldn't read the plan. Add rooms by hand below." }, { status: 500 });
  }
}
