import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * AnimatedCounter — counts from 0 to target value when scrolled into view.
 */
export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
  className = "",
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const counter = { val: 0 };

    gsap.to(counter, {
      val: value,
      duration,
      ease: "power2.out",
      scrollTrigger: window.matchMedia("(max-width: 768px)").matches ? undefined : {
        trigger: el,
        start: "top 95%",
        once: true,
      },
      onUpdate: () => {
        if (el) {
          const rounded = value >= 100 ? Math.round(counter.val).toLocaleString() : counter.val.toFixed(1);
          el.textContent = `${prefix}${rounded}${suffix}`;
        }
      },
    });
  }, [value, suffix, prefix, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
