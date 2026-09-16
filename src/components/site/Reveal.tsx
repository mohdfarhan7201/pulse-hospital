import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type RevealVariant =
  | "fade-up"
  | "fade-left"
  | "fade-right"
  | "scale"
  | "flip"
  | "blur";

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  variant = "fade-up",
  stagger = 0,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
  variant?: RevealVariant;
  stagger?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(max-width: 768px)").matches) {
      gsap.set(el, { clearProps: "all" });
      return;
    }

    const fromVars: gsap.TweenVars = {
      opacity: 0,
    };

    switch (variant) {
      case "fade-up":
        fromVars.y = 50;
        fromVars.filter = "blur(6px)";
        break;
      case "fade-left":
        fromVars.x = -60;
        fromVars.filter = "blur(6px)";
        break;
      case "fade-right":
        fromVars.x = 60;
        fromVars.filter = "blur(6px)";
        break;
      case "scale":
        fromVars.scale = 0.88;
        fromVars.y = 30;
        break;
      case "flip":
        fromVars.rotateY = 15;
        fromVars.y = 40;
        fromVars.scale = 0.95;
        break;
      case "blur":
        fromVars.filter = "blur(16px)";
        fromVars.y = 20;
        break;
    }

    const toVars: gsap.TweenVars = {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotateY: 0,
      filter: "blur(0px)",
      duration: 0.85,
      ease: "power3.out",
      delay: delay / 1000,
      clearProps: "transform,opacity,filter",
    };

    const ctx = gsap.context(() => {
      // If already in viewport (e.g. jumping to hash #about or already visible)
      const rect = el.getBoundingClientRect();
      const inViewAlready = rect.top < window.innerHeight * 0.95 && rect.bottom > 0;

      if (inViewAlready) {
        if (stagger > 0 && el.children.length > 0) {
          gsap.fromTo(el.children, fromVars, { ...toVars, stagger: stagger / 1000 });
        } else {
          gsap.fromTo(el, fromVars, toVars);
        }
        return;
      }

      if (stagger > 0 && el.children.length > 0) {
        gsap.fromTo(el.children, fromVars, {
          ...toVars,
          stagger: stagger / 1000,
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            once: true,
          },
        });
      } else {
        gsap.fromTo(el, fromVars, {
          ...toVars,
          scrollTrigger: {
            trigger: el,
            start: "top 95%",
            once: true,
          },
        });
      }
    }, el);

    return () => ctx.revert();
  }, [delay, variant, stagger]);

  const Comp = Tag as unknown as React.ElementType;
  return (
    <Comp ref={ref as never} className={className}>
      {children}
    </Comp>
  );
}
