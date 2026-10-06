import { availability } from "@/config/site";

// All slot maths happens in IST (UTC+5:30, no DST).
const IST_OFFSET_MIN = 330;

export function istNow() {
  return new Date(Date.now() + IST_OFFSET_MIN * 60000); // read with getUTC* to get IST fields
}

export function istToUtc(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - IST_OFFSET_MIN * 60000);
}

export function bookableDates(blocked: string[]) {
  const out: string[] = [];
  const now = istNow();
  for (let i = 0; i <= availability.bookAheadDays; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i));
    const iso = d.toISOString().slice(0, 10);
    if (!availability.days.includes(d.getUTCDay())) continue;
    if (blocked.includes(iso)) continue;
    out.push(iso);
  }
  return out;
}

export function slotsFor(date: string, taken: string[], minutes: number) {
  const [sh, sm] = availability.start.split(":").map(Number);
  const [eh, em] = availability.end.split(":").map(Number);
  const out: string[] = [];
  const earliest = Date.now() + availability.minNoticeHours * 3600000;
  for (let t = sh * 60 + sm; t + minutes <= eh * 60 + em; t += availability.slotMinutes) {
    const time = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    if (istToUtc(date, time).getTime() < earliest) continue;
    // a slot is blocked if any existing booking overlaps it
    const clash = taken.some((tk) => {
      const [h, m] = tk.split("|")[0].split(":").map(Number);
      const len = Number(tk.split("|")[1] || availability.slotMinutes);
      const s = h * 60 + m;
      return t < s + len && s < t + minutes;
    });
    if (!clash) out.push(time);
  }
  return out;
}
