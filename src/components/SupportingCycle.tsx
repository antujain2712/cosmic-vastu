import { elementInfo, Element, directionInfo } from "@/lib/knowledge";

// Positions follow the compass: Water north (top), Wood east, Fire south-east, Earth south-west, Metal west.
const pos: Record<Element, [number, number]> = {
  water: [200, 60],
  wood: [335, 160],
  fire: [285, 320],
  earth: [115, 320],
  metal: [65, 160],
};
const order: Element[] = ["earth", "metal", "water", "wood", "fire"];
const area: Record<Element, string> = { water: "Opportunity", wood: "Relationships", fire: "Action", earth: "Completion", metal: "Possibility" };

export function SupportingCycle({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const fg = tone === "dark" ? "#1f2328" : "#f3f2ee";
  return (
    <svg viewBox="0 0 400 390" className="w-full max-w-md h-auto" role="img" aria-label="The supporting cycle: Earth supports Metal, Metal supports Water, Water supports Wood, Wood supports Fire, Fire supports Earth">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill={fg} />
        </marker>
      </defs>
      {order.map((from, k) => {
        const to = order[(k + 1) % order.length];
        const [x1, y1] = pos[from];
        const [x2, y2] = pos[to];
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        const sx = x1 + ux * 46, sy = y1 + uy * 46, ex = x2 - ux * 50, ey = y2 - uy * 50;
        // bow outward from the centre
        const mx = (sx + ex) / 2, my = (sy + ey) / 2;
        const ox = mx - 200, oy = my - 195, ol = Math.hypot(ox, oy) || 1;
        const cx = mx + (ox / ol) * 26, cy = my + (oy / ol) * 26;
        return <path key={from} d={`M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`} fill="none" stroke={fg} strokeWidth={1.4} markerEnd="url(#arr)" />;
      })}
      {order.map((e) => {
        const [x, y] = pos[e];
        const i = elementInfo[e];
        return (
          <g key={e}>
            <circle cx={x} cy={y} r={40} fill={i.hex} />
            <text x={x} y={y + 2} textAnchor="middle" fill="#f3f2ee" fontSize={17} fontFamily="var(--font-anton)" letterSpacing="0.04em">{i.name.toUpperCase()}</text>
            <text x={x} y={y + 17} textAnchor="middle" fill="#f3f2ee" fontSize={10} fontFamily="var(--font-jost)">{directionInfo[i.direction].name}</text>
            <text x={x} y={y + (y > 200 ? 62 : -50)} textAnchor="middle" fill={fg} fontSize={13} fontFamily="var(--font-jost)">{area[e]}</text>
          </g>
        );
      })}
    </svg>
  );
}
