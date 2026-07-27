import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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

    const fromVars: gsap.TweenVars = {
      opacity: 0,
      duration: 1,
      ease: "power3.out",
      delay: delay / 1000,
    };

    switch (variant) {
      case "fade-up":
        fromVars.y = 60;
        fromVars.filter = "blur(8px)";
        break;
      case "fade-left":
        fromVars.x = -80;
        fromVars.filter = "blur(6px)";
        break;
      case "fade-right":
        fromVars.x = 80;
        fromVars.filter = "blur(6px)";
        break;
      case "scale":
        fromVars.scale = 0.85;
        fromVars.y = 40;
        break;
      case "flip":
        fromVars.rotateY = 15;
        fromVars.y = 50;
        fromVars.scale = 0.95;
        break;
      case "blur":
        fromVars.filter = "blur(20px)";
        fromVars.y = 30;
        break;
    }

    if (stagger > 0) {
      const children = el.children;
      if (children.length > 0) {
        gsap.from(children, {
          ...fromVars,
          stagger: stagger / 1000,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        });
        return;
      }
    }

    gsap.from(el, {
      ...fromVars,
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true,
      },
    });
  }, [delay, variant, stagger]);

  const Comp = Tag as unknown as React.ElementType;
  return (
    <Comp ref={ref as never} className={className} style={{ willChange: "transform, opacity" }}>
      {children}
    </Comp>
  );
}
