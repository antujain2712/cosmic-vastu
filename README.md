# Cosmic Vastu Culture — Sanjay Raj Jain

Website and AI Vastu platform built on Sanjay-ji's five-element method.

## Run it

```bash
npm install
cp .env.example .env.local   # optional — works without keys in demo mode
npm run dev                  # http://localhost:3000
```

Studio dashboard: `/admin` (password from `ADMIN_PASSWORD`, default `change-me`).

## What's inside

| Page | What it does |
|---|---|
| `/` | Home: live compass hero, method, elements, about, services, plans |
| `/elements` | Full five-element guide, supporting cycle, six presences, hospital mapping |
| `/quiz` | Free 12-question element check → weakest element, tips, email capture |
| `/analyze` | 5 steps: space → door direction (camera + compass) → floor plan upload + AI room detection → Vastu grid → review |
| `/report/[id]` | Score, element bars, room-by-room findings, paid AI report, chat assistant with quotas, upgrades |
| `/book` | Online / in-person booking with live slots, Razorpay payment, email confirmations |
| `/admin` | Bookings, reports, payments, leads (CSV), block days |

## How the pieces fit

- **`src/lib/knowledge.ts`** — Sanjay-ji's teaching from his booklets: elements, directions, colours, shapes, messages, supporting cycle, six presences. Items marked `confirmed: false` / `crystalsConfirmed: false` are general practice he still needs to sign off.
- **`src/lib/rules.ts`** — the free, instant rules engine: room placement table (best / acceptable / avoid per direction), scoring that rewards *balance* not just high numbers, remedies via the supporting cycle. **Sanjay-ji should review the `roomInfo` table.**
- **`src/lib/ai.ts`** — three AI jobs on three models (set in `src/config/site.ts`):
  - room detection from a floor plan — Haiku (cheap, runs before purchase, rate-limited)
  - written report with vision — Sonnet (runs only after payment)
  - chat assistant — Haiku, with per-plan question limits
- **`src/config/site.ts`** — prices (₹ and $), plan contents, consultation fees, weekly hours, contact details. Values marked PLACEHOLDER need confirming.
- **Payments** — Razorpay orders + signature verification + webhook backup. Upgrades charge only the difference. Without keys a test checkout appears and no money moves.
- **Data** — a JSON file in `data/` so it runs with zero setup.

## Before going live

1. Sanjay-ji reviews `roomInfo` in `rules.ts`, the unconfirmed directions (NE, S, NW, centre) and crystals in `knowledge.ts`, and the prices in `site.ts`.
2. Add `ANTHROPIC_API_KEY`, Razorpay keys + webhook, Resend key, a strong `ADMIN_PASSWORD`.
3. **Hosting:** the JSON store needs a persistent disk. Either deploy to a server with a disk (Railway, Render, a VPS), or move `src/lib/db.ts` to Supabase/Postgres before deploying to Vercel. Uploaded images likewise go to object storage (Supabase Storage / S3).
4. Have a lawyer review `/terms` (refunds, privacy, disclaimer).
5. Video-call links for online sessions are sent manually for now — next step is a Google Calendar / Zoom integration.
