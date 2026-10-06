import { ELEMENTS, Element, elementInfo, directionInfo } from "@/lib/knowledge";

/** Five columns, one per element, filled to its score — reads like a mixing desk of the space. */
export function ElementBars({ scores, weakest }: { scores: Record<Element, number>; weakest?: Element }) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-4" role="list" aria-label="Element balance">
      {ELEMENTS.map((e) => {
        const i = elementInfo[e];
        const v = scores[e];
        return (
          <div key={e} role="listitem" aria-label={`${i.name} ${v} out of 100`} className="flex flex-col items-center">
            <div className="relative w-full h-44 sm:h-56 rounded-md bg-ink/8 overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 transition-[height] duration-700" style={{ height: `${v}%`, background: i.hex }} />
              <div className="absolute inset-x-0 border-t border-dashed border-ink/40" style={{ bottom: "70%" }} aria-hidden />
              <span className="absolute top-2 inset-x-0 text-center display text-2xl sm:text-3xl text-ink/80">{v}</span>
            </div>
            <span className={`mt-2 text-sm sm:text-base font-medium ${weakest === e ? "underline decoration-fire decoration-2 underline-offset-4" : ""}`}>{i.name}</span>
            <span className="text-xs text-ink-soft">{directionInfo[i.direction].name}</span>
          </div>
        );
      })}
    </div>
  );
}
