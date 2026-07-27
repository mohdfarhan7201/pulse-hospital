import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Cinematic ECG / Heartbeat Preloader
 * —————————————————————————————————————
 * 1. A glowing ECG line draws itself across the screen (like a hospital monitor)
 * 2. A tracer glow sweeps across the ECG
 * 3. Heart icon pulses in sync with the QRS peaks
 * 4. BPM counter animates from 0 → 72
 * 5. Hospital name types in letter-by-letter
 * 6. Screen wipes away with a scale + blur transition
 */

/* ── SVG ECG path (realistic sinus rhythm with 3 QRS complexes) ── */
const ECG_PATH =
  "M0,50 L40,50 L50,50 L55,48 L60,52 L65,50 L80,50 L85,50 L90,30 L95,80 L100,10 L105,70 L110,50 L130,50 L140,50 L145,48 L148,53 L152,46 L155,50 L200,50 L210,50 L215,48 L220,52 L225,50 L240,50 L245,50 L250,30 L255,80 L260,10 L265,70 L270,50 L290,50 L300,50 L305,48 L308,53 L312,46 L315,50 L360,50 L370,50 L375,48 L380,52 L385,50 L400,50 L405,50 L410,30 L415,80 L420,10 L425,70 L430,50 L450,50 L460,50 L465,48 L468,53 L472,46 L475,50 L520,50";

const HOSPITAL_NAME = "PULSE HEART CENTRE";

export function Loader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ecgPathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<SVGSVGElement>(null);
  const bpmRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const path = ecgPathRef.current;
      const glow = glowRef.current;
      const heart = heartRef.current;
      const bpm = bpmRef.current;
      const name = nameRef.current;
      const container = containerRef.current;
      if (!path || !glow || !heart || !bpm || !name || !container) return;

      /* Get path length for stroke animation */
      const length = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });

      /* Master timeline */
      const tl = gsap.timeline({
        onComplete: () => {
          /* Exit animation */
          gsap.to(container, {
            scale: 1.08,
            opacity: 0,
            filter: "blur(16px)",
            duration: 0.9,
            ease: "power3.inOut",
            onComplete: () => setGone(true),
          });
        },
      });

      /* Phase 1: ECG line draws itself (0 → 2.8s) */
      tl.to(path, {
        strokeDashoffset: 0,
        duration: 2.8,
        ease: "none",
      });

      /* Phase 1b: Sweeping glow follows the draw */
      tl.fromTo(
        glow,
        { left: "0%", opacity: 0 },
        {
          left: "100%",
          opacity: 1,
          duration: 2.8,
          ease: "none",
        },
        0,
      );
      tl.to(glow, { opacity: 0, duration: 0.3 }, 2.5);

      /* Phase 1c: Heartbeat pulses at QRS peaks (3 beats) */
      const beatTimes = [0.55, 1.35, 2.15];
      beatTimes.forEach((t) => {
        tl.to(
          heart,
          {
            scale: 1.35,
            duration: 0.12,
            ease: "power2.out",
          },
          t,
        );
        tl.to(
          heart,
          {
            scale: 1,
            duration: 0.4,
            ease: "elastic.out(1, 0.4)",
          },
          t + 0.12,
        );
      });

      /* Phase 2: BPM counter animates (0.2 → 2.6s) */
      const counter = { val: 0 };
      tl.to(
        counter,
        {
          val: 72,
          duration: 2.4,
          ease: "power2.out",
          onUpdate: () => {
            if (bpm) bpm.textContent = String(Math.round(counter.val));
          },
        },
        0.2,
      );

      /* Phase 3: Hospital name types in (1.0s → ~2.0s) */
      const chars = name.querySelectorAll(".preloader-char");
      tl.fromTo(
        chars,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.04,
          ease: "power2.out",
          duration: 0.35,
        },
        1.0,
      );

      /* Phase 4: Hold for a beat (2.8 → 3.4s) */
      tl.to({}, { duration: 0.5 });
    });

    return () => ctx.revert();
  }, []);

  if (gone) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[oklch(0.08_0.04_265)]"
      style={{ willChange: "transform, opacity" }}
    >
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.4_0.18_210_/_0.08)] blur-[120px]" />
        <div className="absolute left-1/3 top-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[oklch(0.55_0.22_20_/_0.06)] blur-[80px]" />
      </div>

      {/* Heart icon */}
      <svg
        ref={heartRef}
        viewBox="0 0 24 24"
        className="relative mb-8 h-16 w-16"
        style={{ transformOrigin: "center", willChange: "transform" }}
      >
        <defs>
          <linearGradient id="preloader-heart-grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="oklch(0.7 0.22 20)" />
            <stop offset="1" stopColor="oklch(0.6 0.16 210)" />
          </linearGradient>
          <filter id="heart-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          fill="url(#preloader-heart-grad)"
          filter="url(#heart-glow)"
          d="M12 21s-7-4.35-9.5-9.5C.9 7.9 3.4 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.6 0 6.1 3.9 4.5 7.5C19 16.65 12 21 12 21z"
        />
      </svg>

      {/* ECG Monitor */}
      <div className="relative w-full max-w-xl px-6">
        <svg
          viewBox="0 0 520 100"
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: "visible" }}
        >
          {/* Grid lines for monitor feel */}
          <defs>
            <pattern id="ecg-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="oklch(0.3 0.05 210)" strokeWidth="0.3" opacity="0.3" />
            </pattern>
            <linearGradient id="ecg-line-grad" x1="0" x2="1">
              <stop offset="0" stopColor="oklch(0.7 0.18 165)" />
              <stop offset="0.5" stopColor="oklch(0.85 0.22 165)" />
              <stop offset="1" stopColor="oklch(0.7 0.18 165)" />
            </linearGradient>
            <filter id="ecg-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect x="0" y="0" width="520" height="100" fill="url(#ecg-grid)" rx="8" />
          <path
            ref={ecgPathRef}
            d={ECG_PATH}
            fill="none"
            stroke="url(#ecg-line-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ecg-glow)"
          />
        </svg>

        {/* Sweeping glow tracer */}
        <div
          ref={glowRef}
          className="pointer-events-none absolute top-0 h-full w-8 -translate-x-1/2 opacity-0"
          style={{
            background: "radial-gradient(ellipse at center, oklch(0.8 0.2 165 / 0.6), transparent 70%)",
            filter: "blur(8px)",
          }}
        />
      </div>

      {/* BPM Display */}
      <div className="relative mt-8 flex items-baseline gap-2">
        <span
          ref={bpmRef}
          className="font-display text-5xl font-bold tabular-nums"
          style={{
            background: "linear-gradient(135deg, oklch(0.98 0 0), oklch(0.75 0.12 210))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          0
        </span>
        <span className="text-sm uppercase tracking-[0.3em] text-white/40">BPM</span>
      </div>

      {/* Hospital name — typed in */}
      <div ref={nameRef} className="relative mt-6 flex gap-[2px]">
        {HOSPITAL_NAME.split("").map((char, i) => (
          <span
            key={i}
            className="preloader-char text-xs font-medium tracking-[0.4em] text-white/60"
            style={{
              opacity: 0,
              display: char === " " ? "inline" : "inline-block",
              width: char === " " ? "0.5em" : "auto",
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-8 left-1/2 h-[2px] w-16 -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[oklch(0.55_0.22_20)] to-[oklch(0.6_0.16_210)]"
          style={{
            animation: "preloader-progress 3.4s ease-out forwards",
          }}
        />
      </div>
    </div>
  );
}
