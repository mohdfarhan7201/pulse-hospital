import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollProgress — a vertical line that draws as you scroll through a section.
 * Used for the patient journey / timeline section.
 */
export function ScrollProgress({
  className = "",
}: {
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const line = lineRef.current;
    if (!el || !line) return;

    gsap.fromTo(
      line,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 60%",
          end: "bottom 40%",
          scrub: 0.5,
        },
      },
    );
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-[oklch(0.9_0.01_250)]">
        <div
          ref={lineRef}
          className="h-full w-full origin-top rounded-full bg-gradient-to-b from-[oklch(0.55_0.22_20)] to-[oklch(0.42_0.18_265)]"
        />
      </div>
    </div>
  );
}
