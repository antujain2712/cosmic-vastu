import { NextResponse } from "next/server";
import { read } from "@/lib/db";
import { reportView } from "@/lib/view";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await read((db) => db.reports.find((x) => x.id === id));
  if (!r) return NextResponse.json({ error: "Report not found. Check the link." }, { status: 404 });
  return NextResponse.json(reportView(r));
}
