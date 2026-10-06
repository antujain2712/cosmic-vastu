// Central business configuration. Edit prices, contact details and hours here.
// Everything marked PLACEHOLDER needs Sanjay-ji's confirmation before launch.

export const site = {
  brand: "Cosmic Vastu Culture",
  consultant: "Sanjay Raj Jain",
  title: "Vastu Shastra Consultant",
  since: 1997,
  consultations: "6,000+", // site says 6000+, older meta says 2000+ — confirm
  email: "cosmicculture@gmail.com",
  altEmail: "vastuculture@gmail.com",
  phone: "+91 99679 69626",
  whatsapp: "919967969626",
  instagram: "sanjayjain.vastu",
  linkedin: "san7jay",
  twitter: "san7jay",
  address: "37, 38 Cineprime, Beverly Park, Mira Road East, Mumbai 401107, India",
  signoff: "Subh aur mangalmay ho",
};

export type Tier = "free" | "basic" | "specialised" | "indepth";
export type Currency = "INR" | "USD";

export const tiers: Record<
  Tier,
  { name: string; price: Record<Currency, number>; questions: number; blurb: string; includes: string[] }
> = {
  free: {
    name: "Free check",
    price: { INR: 0, USD: 0 },
    questions: 2,
    blurb: "See your element balance and your top three findings.",
    includes: ["Five-element balance score", "Top 3 findings", "2 questions to the Vastu assistant"],
  },
  basic: {
    name: "Basic",
    price: { INR: 799, USD: 12 },
    questions: 5,
    blurb: "Every room checked against its ideal direction, with simple fixes.",
    includes: [
      "Everything in Free",
      "Room-by-room findings",
      "Colour and shape remedies for each zone",
      "5 questions to the Vastu assistant",
    ],
  },
  specialised: {
    name: "Specialised",
    price: { INR: 2499, USD: 39 },
    questions: 15,
    blurb: "AI reads your floor plan and photos, then writes your personal plan.",
    includes: [
      "Everything in Basic",
      "AI reading of your floor plan and photos",
      "Written report in Sanjay-ji's method",
      "Crystal and placement suggestions",
      "15 questions to the Vastu assistant",
    ],
  },
  indepth: {
    name: "In-depth",
    price: { INR: 6999, USD: 99 },
    questions: 100,
    blurb: "The full picture: life areas, a step-by-step action plan, and priority support.",
    includes: [
      "Everything in Specialised",
      "Life-area reading: cash flow, relationships, action, stability, capital",
      "Action plan ordered by impact and budget",
      "Printable report",
      "100 questions to the Vastu assistant",
      "₹/$ credit towards a consultation with Sanjay-ji",
    ],
  },
};

export const tierOrder: Tier[] = ["free", "basic", "specialised", "indepth"];
export const tierRank = (t: Tier) => tierOrder.indexOf(t);

export type ConsultType = "online" | "inperson";

export const consultations: Record<
  ConsultType,
  { name: string; minutes: number; price: Record<Currency, number>; note: string; deposit?: boolean }
> = {
  online: {
    name: "Online consultation",
    minutes: 60,
    price: { INR: 11000, USD: 150 }, // PLACEHOLDER
    note: "A video call with Sanjay-ji. Share your floor plan beforehand; he walks through it with you live.",
  },
  inperson: {
    name: "In-person Vastu visit",
    minutes: 120,
    price: { INR: 50000, USD: 600 }, // booking deposit; USD figure is a PLACEHOLDER conversion
    deposit: true,
    note: "Sanjay-ji visits your home, office or site. You pay a booking deposit now; the final fee depends on the location and is discussed with Sanjay-ji on a call after you book.",
  },
};

// Credit an In-depth buyer gets towards a consultation (PLACEHOLDER)
export const indepthConsultCredit: Record<Currency, number> = { INR: 2000, USD: 25 };

// Weekly availability in IST. 0 = Sunday. PLACEHOLDER — Sanjay-ji to confirm.
export const availability = {
  timezone: "Asia/Kolkata",
  days: [1, 2, 3, 4, 5, 6] as number[],
  start: "11:00",
  end: "19:00",
  slotMinutes: 60,
  bookAheadDays: 45,
  minNoticeHours: 18,
};

export const models = {
  // Cheap, fast vision: auto-detect rooms from a floor plan before purchase
  detect: "claude-haiku-4-5-20251001",
  // Careful vision + report writing after purchase
  report: "claude-sonnet-5-5",
  // Chat assistant
  chat: "claude-haiku-4-5-20251001",
};

export function formatPrice(amount: number, currency: Currency) {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
