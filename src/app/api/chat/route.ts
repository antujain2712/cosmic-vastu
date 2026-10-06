import { NextResponse } from "next/server";
import { read, tx } from "@/lib/db";
import { chatReply } from "@/lib/ai";
import { tiers } from "@/config/site";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("reportId") ?? "";
  const msgs = await read((db) => db.chats[id] ?? []);
  return NextResponse.json({ messages: msgs });
}

export async function POST(req: Request) {
  const { reportId, message } = (await req.json()) as { reportId: string; message: string };
  const text = (message ?? "").trim().slice(0, 1200);
  if (!text) return NextResponse.json({ error: "Type a question first." }, { status: 400 });

  const r = await read((db) => db.reports.find((x) => x.id === reportId));
  if (!r) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const left = tiers[r.tier].questions - r.questionsUsed;
  if (left <= 0) return NextResponse.json({ error: "You've used all your questions for this plan. Upgrade to ask more.", upgrade: true }, { status: 402 });

  const history = await read((db) => db.chats[reportId] ?? []);
  let answer: string;
  try {
    answer = await chatReply(r, history, text);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "The assistant didn't answer. Your question wasn't counted — try again." }, { status: 502 });
  }
  const at = new Date().toISOString();
  await tx((db) => {
    db.chats[reportId] = [...(db.chats[reportId] ?? []), { role: "user", content: text, at }, { role: "assistant", content: answer, at }];
    const x = db.reports.find((y) => y.id === reportId);
    if (x) x.questionsUsed += 1;
  });
  return NextResponse.json({ answer, questionsLeft: left - 1 });
}
