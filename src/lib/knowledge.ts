// Sanjay Raj Jain's Cosmic Vastu Culture knowledge base.
// Source: "The 5 Element" booklet (Edition 3), "Industrial Spaces: Elements in Harmony",
// and the "Vastu & Feng Shui for Hospitals" draft.
// Anything with `confirmed: false` is general Vastu practice that Sanjay-ji has not yet signed off.

export type Element = "water" | "wood" | "fire" | "earth" | "metal";
export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW" | "C";

export const ELEMENTS: Element[] = ["water", "wood", "fire", "earth", "metal"];

export const elementInfo: Record<
  Element,
  {
    name: string;
    direction: Direction;
    sanskrit: string;
    shape: string;
    colours: string;
    swatches: string[];
    qualities: string[];
    lifeArea: string;
    leadership: string;
    message: string;
    teaching: string;
    crystals: string[];
    crystalsConfirmed: boolean;
    image: string;
    hex: string;
  }
> = {
  water: {
    name: "Water",
    direction: "N",
    sanskrit: "Uttara",
    shape: "Circles and waves",
    colours: "All shades from blue to violet",
    swatches: ["#9ED3E6", "#5FA6D6", "#2F6FB0", "#3A3F9A", "#6B4FA0", "#8E6CC0"],
    qualities: ["Flow", "Adaptability", "Emotional balance"],
    lifeArea: "Opportunity — cash flow, turnover, demand and supply",
    leadership: "Balance, flexibility, clarity",
    message: "Where there is flow, there is balance and prosperity.",
    teaching:
      "Some opportunity exists; we just need to grab it. Most opportunity does not exist unless we prepare enough for it to occur when the time comes. Water's flow synergises cash flow, turnover, demand and supply, at home and at the workplace.",
    crystals: ["Aquamarine", "Blue lace agate", "Amethyst"],
    crystalsConfirmed: false,
    image: "/img/water.jpg",
    hex: "#3E7FB8",
  },
  wood: {
    name: "Wood",
    direction: "E",
    sanskrit: "Purva",
    shape: "Rectangle",
    colours: "All shades of green",
    swatches: ["#C9E3A6", "#9CCB6B", "#6FA845", "#4E8A34", "#336B26", "#1F4D1A"],
    qualities: ["Growth", "Steady progress"],
    lifeArea: "Relationships — friends, family, who is who",
    leadership: "Relationship, growth, expansion",
    message: "Where relationships are strong, growth is continuous.",
    teaching:
      "No result can be bigger than the background of being related. Relationship takes the lead; all that we build and break is for someone. Wood brings vitality, flexibility and the energy of rejuvenation into a space.",
    crystals: ["Green aventurine", "Jade", "Malachite"],
    crystalsConfirmed: false,
    image: "/img/wood.jpg",
    hex: "#4F7A3A",
  },
  fire: {
    name: "Fire",
    direction: "SE",
    sanskrit: "Agneya",
    shape: "Triangle",
    colours: "All shades of red",
    swatches: ["#F4C2B8", "#EE8C7A", "#E2513B", "#C4281E", "#9E1A17", "#6E1010"],
    qualities: ["Action", "Passion", "Will power"],
    lifeArea: "Action — energy, ambition, being productive",
    leadership: "Energy, dynamism, progress",
    message: "Where there is flame, there is progress.",
    teaching:
      "Fire within outputs us into action. Energy is required for every tool and technology to function. Be productive versus just being active.",
    crystals: ["Carnelian", "Red jasper", "Sunstone"],
    crystalsConfirmed: false,
    image: "/img/fire.jpg",
    hex: "#D9502A",
  },
  earth: {
    name: "Earth",
    direction: "SW",
    sanskrit: "Nairutya",
    shape: "Square and straight lines",
    colours: "All shades of brown",
    swatches: ["#D8C3AE", "#B89A80", "#977660", "#76584A", "#5A4037", "#3E2C27"],
    qualities: ["Stability", "Grounding", "Calm"],
    lifeArea: "Completion — foundation, security, finishing what is incomplete",
    leadership: "Stability, security, foundation",
    message: "Where the foundation is firm, prosperity is lasting.",
    teaching:
      "We keep bringing completion to anything incomplete around us, to develop and build prosperity brick by brick. Earth brings solidity, support and a feeling of security and abundance.",
    crystals: ["Tiger's eye", "Smoky quartz", "Brown jasper"],
    crystalsConfirmed: false,
    image: "/img/earth.jpg",
    hex: "#8A6A4F",
  },
  metal: {
    name: "Metal",
    direction: "W",
    sanskrit: "Paschima",
    shape: "Circle and semi-circle",
    colours: "White, silver, golden, copper, bronze, grey",
    swatches: ["#F2F2F0", "#C9CDD2", "#9AA3AD", "#D4AF37", "#B87333", "#8C7853"],
    qualities: ["Clarity", "Creativity", "Strength"],
    lifeArea: "Possibility — capital, identity, status",
    leadership: "Identity, structure, discipline",
    message: "Where there is structure, there is identity and permanence.",
    teaching:
      "Metal makes things possible. It gives strength to a structure; the way it is shaped inside a tool is how it performs outside. Wealth, when honoured and quietly secured, becomes a silent ally — true prosperity is not loud, it is magnetic.",
    crystals: ["Pyrite", "Clear quartz", "Hematite"],
    crystalsConfirmed: false,
    image: "/img/metal.jpg",
    hex: "#8D96A0",
  },
};

// The supporting (nourishing) cycle, in Sanjay-ji's words
export const supportingCycle: { from: Element; to: Element; how: string }[] = [
  { from: "earth", to: "metal", how: "Earth supports Metal by providing the foundation and stability for its structure." },
  { from: "metal", to: "water", how: "Metal supports Water by containing and directing its flow." },
  { from: "water", to: "wood", how: "Water supports Wood by nourishing its growth and vitality." },
  { from: "wood", to: "fire", how: "Wood supports Fire by providing the fuel and material for its energy." },
  { from: "fire", to: "earth", how: "Fire supports Earth by transforming into ash, which nourishes the soil." },
];

// Elements that weaken each other (controlling cycle) — general practice, not yet in his material
export const controllingCycle: { from: Element; to: Element }[] = [
  { from: "water", to: "fire" },
  { from: "fire", to: "metal" },
  { from: "metal", to: "wood" },
  { from: "wood", to: "earth" },
  { from: "earth", to: "water" },
];

export const directionInfo: Record<
  Direction,
  { name: string; script: string; elements: Partial<Record<Element, number>>; confirmed: boolean; note: string }
> = {
  N: { name: "North", script: "North", elements: { water: 1 }, confirmed: true, note: "Water — opportunity and cash flow." },
  E: { name: "East", script: "East", elements: { wood: 1 }, confirmed: true, note: "Wood — relationships, friends and family." },
  SE: { name: "South-east", script: "Southeast", elements: { fire: 1 }, confirmed: true, note: "Fire — action, passion, will power." },
  SW: { name: "South-west", script: "Southwest", elements: { earth: 1 }, confirmed: true, note: "Earth — completion, stability, foundation." },
  W: { name: "West", script: "West", elements: { metal: 1 }, confirmed: true, note: "Metal — possibility, capital, structure." },
  NE: { name: "North-east", script: "Northeast", elements: { water: 0.6, wood: 0.4 }, confirmed: false, note: "Between Water and Wood. Traditionally kept light, open and clean." },
  S: { name: "South", script: "South", elements: { fire: 0.5, earth: 0.5 }, confirmed: false, note: "Between Fire and Earth. Traditionally suits weight and rest." },
  NW: { name: "North-west", script: "Northwest", elements: { metal: 0.5, water: 0.5 }, confirmed: false, note: "Between Metal and Water. Traditionally the zone of air and movement." },
  C: { name: "Centre", script: "Centre", elements: {}, confirmed: false, note: "Brahmasthan. Traditionally kept open, light and free of weight." },
};

export const DIRECTIONS: Direction[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "C"];

export function headingToDirection(deg: number): Exclude<Direction, "C"> {
  const d = ((deg % 360) + 360) % 360;
  const dirs: Exclude<Direction, "C">[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(d / 45) % 8];
}

// What belongs to each element inside a space (six presences — industrial deck; hospital draft)
export const presences: Record<Element | "people", { title: string; items: string[] }> = {
  water: {
    title: "Water presence",
    items: ["Underground and overhead tanks", "Pipelines, taps and valves", "Drainage, septic tank, soak pit, STP", "Cooling towers", "Liquids: chemicals, oils, paints, beverages", "Rainwater harvesting", "Running water in toilets and kitchens"],
  },
  wood: {
    title: "Wood presence",
    items: ["Furniture and fixtures", "Doors and partitions", "Packaging: boxes, crates, pallets", "Stationery and paper", "Plants, trees and greenery", "Plant-based food", "Cotton and plant-fibre clothing"],
  },
  fire: {
    title: "Fire presence",
    items: ["Transformers and electrical panels", "Supply and wiring", "Lighting and appliances", "Fans, air conditioners, electronics", "Machinery in motion", "Sunlight"],
  },
  earth: {
    title: "Earth presence",
    items: ["Ground and foundation", "Concrete and civil structure: walls, floors, slabs", "Weight of materials, goods, machines and furniture", "How load is distributed across zones"],
  },
  metal: {
    title: "Metal presence",
    items: ["Machinery and equipment", "Tools and fixtures", "Vehicles and loading bays", "Storage racks, cabinets, lockers", "Beams, columns, roofing sheets, ducts", "Metal doors, handles, railings, fencing"],
  },
  people: {
    title: "Human presence",
    items: ["Authority and administration", "Managers and supervisors", "Production heads and line staff", "Office and support teams", "Family members and how they use each room"],
  },
};

export const balancePrinciple = {
  question: "Is it balanced?",
  text: "Presence alone is not enough. The relationship, placement, proportion and interaction between all six presences — Water, Wood, Fire, Earth, Metal and human energy — determine the balance of a space. Not one dominating excessively, not one missing or disrupted.",
  disturbed: [
    { title: "Water weak or misplaced", text: "Prosperity flow and operational harmony may be affected." },
    { title: "Earth overloaded in one zone", text: "Structural and spatial imbalance can arise." },
    { title: "Human energy missing", text: "Certain areas lose vitality, coordination and effectiveness." },
  ],
  growthCycle: [
    "Condition of balance: only when things are well balanced",
    "Outcome of planning: the outcome will come; your planning will take place",
    "Profitability growth: your profitability will grow",
    "Capital growth: your capital will grow",
  ],
  life: "In our body the five elements are balanced, so we have life and growth. In balance there is growth; in imbalance there is deadness and a struggle to survive.",
};

export const philosophy = {
  tagline: "The balanced path of infinite possibilities",
  motto: "It's mine; expands the environment to grow with you",
  method: ["Observe", "Analyze", "Balance", "Grow"],
  choice:
    "You can grow anything on this planet by balancing the five elements. What will you develop, build, create? The choice is yours, and choice is human energy. Nurture it and it will grow; put it out of balance and it creates deadness around you.",
  deconstruction: {
    cosmic: "The vastness of the cosmos — connection to universal forces and celestial energies.",
    vastu: "The ancient science and art of creating harmonious, balanced spaces: architecture, spatial arrangement and energy flow.",
    culture: "Bringing these principles into everyday life, so that cosmic harmony becomes part of how we live.",
  },
};

export const hospitalMapping: { element: Element; covers: string }[] = [
  { element: "earth", covers: "Construction and interior structure: walls, floors, ceilings, pillars" },
  { element: "wood", covers: "Wooden furniture, doors and windows: beds, cabinets, desks, waiting seating" },
  { element: "metal", covers: "Medical equipment, machinery, metal furniture, doors and windows" },
  { element: "fire", covers: "Sunlight, electric lights, fans, ACs and all electronics" },
  { element: "water", covers: "Tanks, taps, washrooms, drainage, fluids and IV lines (to be confirmed)" },
];

export const services = [
  { key: "inperson", title: "In-person Vastu", text: "An on-site visit to read the natural flow of your space and give solutions specific to it." },
  { key: "online", title: "Distance Vastu", text: "An online assessment from your floor plan and photos, with personal recommendations." },
  { key: "blueprint", title: "Blueprint guidance", text: "Working with your architect and design team while the project is still on paper." },
  { key: "crystal", title: "Crystal recommendation", text: "Curated crystals to clear stagnant energy and bring clarity, peace and protection." },
  { key: "commercial", title: "Commercial and industrial", text: "Offices, factories, hospitals and warehouses balanced for flow and growth." },
  { key: "plot", title: "Plots and land", text: "Direction, shape, slope and surroundings, assessed before you buy or build." },
];
