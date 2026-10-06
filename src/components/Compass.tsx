"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { elementInfo, ELEMENTS, directionInfo, Direction } from "@/lib/knowledge";

type OrientationEvt = DeviceOrientationEvent & { webkitCompassHeading?: number };

/** Live compass heading from the phone's sensors. heading = direction the top of the phone points. */
export function useHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "asking" | "live" | "unsupported" | "denied">("idle");
  const last = useRef<number | null>(null);

  const onEvt = useCallback((e: Event) => {
    const ev = e as OrientationEvt;
    let h: number | null = null;
    if (typeof ev.webkitCompassHeading === "number") h = ev.webkitCompassHeading; // iOS
    else if (ev.absolute && typeof ev.alpha === "number") h = 360 - ev.alpha; // Android absolute
    if (h === null) return;
    // light smoothing across the 0/360 seam
    const prev = last.current;
    if (prev !== null) {
      let diff = h - prev;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      h = (prev + diff * 0.35 + 360) % 360;
    }
    last.current = h;
    setHeading(h);
    setStatus("live");
  }, []);

  const start = useCallback(async () => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return setStatus("unsupported");
    const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    setStatus("asking");
    if (typeof DOE.requestPermission === "function") {
      try {
        const res = await DOE.requestPermission();
        if (res !== "granted") return setStatus("denied");
      } catch {
        return setStatus("denied");
      }
    }
    window.addEventListener("deviceorientationabsolute", onEvt as EventListener, true);
    window.addEventListener("deviceorientation", onEvt as EventListener, true);
    // If no reading arrives, this device has no compass (most laptops)
    setTimeout(() => setStatus((s) => (s === "asking" ? "unsupported" : s)), 2500);
  }, [onEvt]);

  useEffect(
    () => () => {
      window.removeEventListener("deviceorientationabsolute", onEvt as EventListener, true);
      window.removeEventListener("deviceorientation", onEvt as EventListener, true);
    },
    [onEvt]
  );

  return { heading, status, start, setHeading };
}

const RING: Exclude<Direction, "C">[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const elementAt = (d: Direction) => ELEMENTS.find((e) => elementInfo[e].direction === d);

/** Compass rose in Sanjay-ji's element colours. `heading` rotates the rose so N stays true north. */
export function CompassRose({
  heading = 0,
  size = 360,
  tone = "light",
  highlight,
}: {
  heading?: number;
  size?: number;
  tone?: "light" | "dark";
  highlight?: Direction | null;
}) {
  const fg = tone === "light" ? "#f3f2ee" : "#1f2328";
  const c = 200;
  return (
    <svg viewBox="0 0 400 400" width={size} height={size} role="img" aria-label="Compass showing the five elements by direction" className="max-w-full h-auto">
      <g style={{ transform: `rotate(${-heading}deg)`, transformOrigin: "200px 200px", transition: "transform 0.25s linear" }}>
        <circle cx={c} cy={c} r={190} fill="none" stroke={fg} strokeOpacity={0.35} />
        <circle cx={c} cy={c} r={150} fill="none" stroke={fg} strokeOpacity={0.6} strokeWidth={1.2} />
        {Array.from({ length: 72 }).map((_, i) => (
          <line key={i} x1={c} y1={14} x2={c} y2={i % 9 === 0 ? 34 : 22} stroke={fg} strokeOpacity={i % 9 === 0 ? 0.9 : 0.35} transform={`rotate(${i * 5} ${c} ${c})`} />
        ))}
        {RING.map((d, i) => {
          const el = elementAt(d);
          const a = i * 45;
          const isHi = highlight === d;
          return (
            <g key={d} transform={`rotate(${a} ${c} ${c})`}>
              <path
                d={`M${c} ${c} L${c - (i % 2 ? 10 : 18)} ${c - 60} L${c} ${i % 2 ? 98 : 74} L${c + (i % 2 ? 10 : 18)} ${c - 60} Z`}
                fill={el ? elementInfo[el].hex : fg}
                fillOpacity={el ? (isHi ? 1 : 0.9) : isHi ? 0.9 : 0.25}
                stroke={isHi ? fg : "none"}
                strokeWidth={2}
              />
              <text x={c} y={i % 2 ? 88 : 64} textAnchor="middle" fill={fg} fontSize={i % 2 ? 13 : 22} fontFamily="var(--font-anton)" transform={`rotate(${-a + heading} ${c} ${i % 2 ? 83 : 56})`}>
                {d}
              </text>
            </g>
          );
        })}
        <circle cx={c} cy={c} r={8} fill={fg} />
      </g>
      {/* fixed pointer = the way the phone faces */}
      <path d={`M${c} 2 L${c - 8} 16 L${c + 8} 16 Z`} fill="#d9502a" />
    </svg>
  );
}

export function directionLabel(d: Direction) {
  return directionInfo[d].name;
}
