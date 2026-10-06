import { read, loadUpload } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// Images are served only to the admin, or to someone holding the report link (?r=reportId)
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const r = new URL(req.url).searchParams.get("r");
  const allowed =
    (await isAdmin()) || (r ? await read((db) => db.reports.some((x) => x.id === r && x.images.includes(name))) : false);
  if (!allowed) return new Response("Not found", { status: 404 });
  const img = await loadUpload(name);
  if (!img) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(img.data, "base64"), { headers: { "Content-Type": img.mediaType, "Cache-Control": "private, max-age=3600" } });
}
