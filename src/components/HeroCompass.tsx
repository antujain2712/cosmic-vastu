"use client";
import { CompassRose, useHeading } from "./Compass";
import { headingToDirection, directionInfo, elementInfo, ELEMENTS } from "@/lib/knowledge";

export function HeroCompass() {
  const { heading, status, start } = useHeading();
  const d = heading !== null ? headingToDirection(heading) : null;
  const el = d ? ELEMENTS.find((e) => elementInfo[e].direction === d) : null;
  return (
    <div className="flex flex-col items-center">
      <CompassRose heading={heading ?? 0} size={420} highlight={d} />
      <div className="mt-4 min-h-[4.5rem] text-center">
        {status === "live" && d ? (
          <>
            <p className="script text-4xl">You face {directionInfo[d].script}</p>
            <p className="text-sm text-paper-2/80 mt-1">
              {Math.round(heading!)}° · {el ? `${elementInfo[el].name}: ${elementInfo[el].qualities.join(", ").toLowerCase()}` : directionInfo[d].note}
            </p>
          </>
        ) : status === "unsupported" || status === "denied" ? (
          <p className="text-sm text-paper-2/80 max-w-xs">
            {status === "denied" ? "Compass access was blocked. Allow motion access in your browser settings to try again." : "This device has no compass. Open the site on your phone and this rose turns with you."}
          </p>
        ) : (
          <button onClick={start} className="btn btn-line !py-2 text-sm">
            {status === "asking" ? "Reading the compass…" : "Use my phone's compass"}
          </button>
        )}
      </div>
    </div>
  );
}
