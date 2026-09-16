import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listPublicDoctorsFn, createPublicAppointmentFn, getHospitalSettingsFn } from "@/lib/api";
import logo1 from "@/assets/logo1.png";
import { AppointmentModal } from "@/components/site/AppointmentModal";
import {
  Activity,
  Ambulance,
  Award,
  Calendar,
  ChevronRight,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  Shield,
  Sparkles,
  Stethoscope,
  Syringe,
  Users,
  Clock,
  ArrowRight,
  Plus,
  Minus,
  Quote,
  Facebook,
  Instagram,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Loader } from "@/components/site/Loader";
import { CursorGlow } from "@/components/site/CursorGlow";
import { EcgLine } from "@/components/site/EcgLine";
import { Reveal } from "@/components/site/Reveal";
import { AnimatedCounter } from "@/components/site/AnimatedCounter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AppointmentStatus } from "@/components/site/AppointmentStatus";

import heroVideo from "@/assets/PULSE BG.mp4";
import doc1 from "@/assets/doctor-1.jpg";
import doc2 from "@/assets/doctor-2.jpg";
import doc3 from "@/assets/doctor-3.jpg";
import cathlab from "@/assets/cathlab.jpg";
import about from "@/assets/About.jpg";
import icu from "@/assets/icu.jpg";
import ot from "@/assets/ot.jpg";
import qrCode from "@/assets/qr.png";

gsap.registerPlugin(ScrollTrigger);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse Heart Centre · Gorakhpur — Advanced Cardiac Care" },
      {
        name: "description",
        content:
          "Pulse Heart Centre, Gorakhpur — a premier cardiac hospital delivering world-class heart care, 24×7 emergency response, advanced cath lab, ICU and expert cardiologists.",
      },
      { property: "og:title", content: "Pulse Heart Centre · Gorakhpur" },
      {
        property: "og:description",
        content:
          "Rhythm of Life — advanced cardiac care in Gorakhpur. Cath lab, ICU, expert cardiologists, 24×7 emergency.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0b1020" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Hospital",
          name: "Pulse Heart Centre",
          medicalSpecialty: "Cardiology",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Infront of Gangotri Nursing School Awas Vikas Colony, H. NO MIG-16, near Munshi Premchand Park, Verma Colony, Betiahata",
            addressLocality: "Gorakhpur",
            addressRegion: "UP",
            postalCode: "273001",
            addressCountry: "IN",
          },
          telephone: "+91-1800-000-000",
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace("#", "");
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    }, 150);

    const onHashChange = () => {
      ScrollTrigger.refresh();
      const currentHash = window.location.hash;
      if (currentHash) {
        const id = currentHash.replace("#", "");
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return (
    <div id="top" className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Loader />
      <CursorGlow />
      <Navbar />
      <main>
        <Hero />
        <div className="relative z-20 bg-background shadow-[0_-20px_50px_rgba(0,0,0,0.2)]">
          <TrustBar />
          <About />
          <Services />
          <Technology />
          <Doctors />
          <Journey />
          <Stats />
          <Testimonials />
          <Calculators />
          <Appointment />
          <FAQ />
          <Contact />
        </div>
      </main>
      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   HERO — GSAP parallax + staggered text entry
   ═══════════════════════════════════════════════════ */
function Hero() {
  const { data: settings } = useQuery({
    queryKey: ["hospital-settings"],
    queryFn: getHospitalSettingsFn,
  });
  const helplinePhone = settings?.helplinePhone || "+91 98765 43210";
  const secondaryPhone = settings?.secondaryPhone || helplinePhone;

  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
      const ctx = gsap.context(() => {
      const section = sectionRef.current;
      const inner = innerRef.current;
      const bg = bgRef.current;
      if (!section || !inner || !bg) return;

      /* Apple-style Hero Pin & Scrub */
      gsap.to(inner, {
        scale: 0.9,
        opacity: 0.15,
        y: -80,
        filter: "blur(12px)",
        transformOrigin: "center top",
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top", 
          pin: true,
          pinSpacing: false,
          scrub: 0.5,
        },
      });

      /* Parallax background */
      gsap.to(bg, {
        yPercent: 25,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.5,
        },
      });

      /* Hero text entrance */
      if (contentRef.current) {
        const els = contentRef.current.querySelectorAll(".hero-anim");
        gsap.from(els, {
          y: 80,
          opacity: 0,
          filter: "blur(16px)",
          duration: 1.2,
          stagger: 0.15,
          ease: "power3.out",
          delay: 3.6,  /* after preloader */
        });
      }

      /* Stat cards */
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        gsap.from(cards, {
          x: 100,
          opacity: 0,
          filter: "blur(10px)",
          duration: 1,
          stagger: 0.12,
          ease: "power3.out",
          delay: 4.2,
        });
      }
    });
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative z-0 bg-black">
      <div
        ref={innerRef}
        className="relative isolate flex min-h-screen items-end overflow-hidden pt-32 pb-16 text-white"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, oklch(0.35 0.16 265 / 0.4), transparent 60%), radial-gradient(ellipse at 80% 30%, oklch(0.6 0.16 210 / 0.2), transparent 60%), radial-gradient(ellipse at 60% 90%, oklch(0.55 0.22 20 / 0.15), transparent 60%), linear-gradient(180deg, oklch(0.12 0.03 265), oklch(0.08 0.02 265))",
        }}
      >
      {/* bg video with parallax */}
      <video
        ref={bgRef}
        src={heroVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-screen"
        style={{ willChange: "transform" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[oklch(0.1_0.04_265)]" />

      {/* floating particles */}
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        {[...Array(18)].map((_, i) => (
          <span
            key={i}
            className="absolute block rounded-full bg-white/40 blur-[1px] animate-float-slow"
            style={{
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              top: `${(i * 53) % 100}%`,
              left: `${(i * 37) % 100}%`,
              animationDelay: `${i * 0.4}s`,
              opacity: 0.3 + ((i % 5) / 10),
            }}
          />
        ))}
      </div>

      {/* Scrolling ECG line */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-40 text-[oklch(0.75_0.15_210)]" aria-hidden>
        <div className="flex w-[200%] animate-ecg-scroll">
          <EcgLine className="h-40 w-1/2 shrink-0" />
          <EcgLine className="h-40 w-1/2 shrink-0" />
        </div>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-6 lg:grid-cols-12 lg:items-end">
        <div ref={contentRef} className="lg:col-span-8">
          <span className="hero-anim inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs tracking-[0.28em] uppercase text-white/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> The Rhythm of Life
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-[5.5rem]">
            <span className="hero-anim block">
              Where every
            </span>
            <span className="hero-anim block grad-text-light">
              heartbeat matters.
            </span>
          </h1>
          <p className="hero-anim mt-6 max-w-xl text-lg text-white/70">
            Pulse Heart Centre, Gorakhpur — a sanctuary of advanced cardiac care, expert
            cardiologists and 24×7 emergency response, built around one belief: life is worth
            everything.
          </p>

          <div className="hero-anim mt-9 flex flex-wrap items-center gap-3">
            <AppointmentModal>
              <button
                className="btn-lux inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[oklch(0.18_0.05_265)] shadow-glow cursor-pointer"
              >
                <Calendar className="h-4 w-4" /> Book Appointment
              </button>
            </AppointmentModal>
            <a
              href={`tel:${helplinePhone.replace(/\s+/g, "")}`}
              className="btn-lux inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.55_0.22_20)] to-[oklch(0.65_0.19_30)] px-6 py-3.5 text-sm font-semibold text-white shadow-crimson"
            >
              <Ambulance className="h-4 w-4" /> Emergency 24×7
            </a>
            <a
              href={`tel:${secondaryPhone.replace(/\s+/g, "")}`}
              className="btn-lux inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white/90 backdrop-blur hover:bg-white/10"
            >
              <Phone className="h-4 w-4" /> Call Now
            </a>
          </div>
        </div>

        {/* Glass stat cards */}
        <div ref={cardsRef} className="grid gap-4 lg:col-span-4">
          {[
            { k: "25,000+", v: "Cardiac Procedures", icon: HeartPulse },
            { k: "98.6%", v: "Success Rate", icon: Shield },
            { k: "24 / 7", v: "Emergency Response", icon: Ambulance },
          ].map((s) => (
            <div
              key={s.v}
              className="glass rounded-2xl p-5 text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-3xl font-bold">{s.k}</div>
                  <div className="text-xs uppercase tracking-[0.22em] text-white/70">
                    {s.v}
                  </div>
                </div>
                <s.icon className="h-8 w-8 text-white/80" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* bottom ecg glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[oklch(0.1_0.04_265)] to-transparent" />
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   TRUST BAR — horizontal scroll marquee
   ═══════════════════════════════════════════════════ */
function TrustBar() {
  const items = ["NABH Accredited", "ISO 9001:2015", "Cashless Insurance", "AYUSHMAN Bharat", "24×7 Cardiac ICU", "Fellow of ESC"];
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
      const ctx = gsap.context(() => {
      if (!barRef.current) return;
      const children = barRef.current.children;
      gsap.from(children, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: {
          trigger: barRef.current,
          start: "top 95%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative overflow-hidden border-y border-border bg-white">
      <div ref={barRef} className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-6 text-sm text-muted-foreground">
        {items.map((it) => (
          <div key={it} className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[oklch(0.42_0.18_265)]" />
            <span className="font-medium">{it}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   ABOUT — split-screen parallax
   ═══════════════════════════════════════════════════ */
function About() {
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
      const ctx = gsap.context(() => {
      if (!imgRef.current) return;
      gsap.from(imgRef.current, {
        scale: 0.85,
        opacity: 0,
        x: 80,
        rotation: 3,
        duration: 1.4,
        ease: "power3.out",
        scrollTrigger: {
          trigger: imgRef.current,
          start: "top 95%",
          once: true,
        },
      });

      /* Parallax on the image */
      gsap.to(imgRef.current, {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: imgRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.3,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" className="relative overflow-hidden py-12 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:items-center">
        <Reveal variant="fade-left">
          <SectionEyebrow>About the hospital</SectionEyebrow>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
            A cardiac sanctuary built on <span className="grad-text">precision & compassion</span>.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Led by Dr. Prakash Chand Shahi, a highly acclaimed Interventional Cardiologist (MBBS, MD, DM), Pulse Heart Centre is a purpose-built cardiac facility in Gorakhpur. We pair over 22 years of elite medical expertise with a fully integrated cath lab, cardiac ICU and modular operation theatre.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { t: "Our Mission", d: "Deliver world-class cardiac care that is accessible, ethical and evidence based." },
              { t: "Our Vision", d: "To be Eastern UP's most trusted heart hospital — measured in lives, not numbers." },
              { t: "Core Values", d: "Compassion, precision, integrity, innovation and unwavering respect for life." },
              { t: "Our Legacy", d: "Two decades of cardiac expertise, thousands of hearts healed, one mission." },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-luxe">
                <div className="font-display text-base font-semibold">{c.t}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <div ref={imgRef}>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.2rem] bg-gradient-to-br from-[oklch(0.62_0.15_210_/0.2)] via-transparent to-[oklch(0.55_0.22_20_/0.15)] blur-2xl" />
            <div className="overflow-hidden rounded-[2rem] shadow-luxe">
              <img src={about} alt="Cath lab" width={1400} height={1000} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-8 -left-6 hidden w-64 rounded-2xl border border-border bg-white/90 p-5 shadow-luxe backdrop-blur sm:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.22_20)] to-[oklch(0.4_0.18_265)] text-white">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Live now</div>
                  <div className="font-display font-semibold">72 BPM · Steady</div>
                </div>
              </div>
              <div className="mt-3 overflow-hidden h-10 text-[oklch(0.55_0.22_20)]">
                <div className="flex w-[200%] animate-ecg-scroll">
                  <EcgLine className="h-10 w-1/2 shrink-0" />
                  <EcgLine className="h-10 w-1/2 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   SERVICES — staggered card reveals with 3D
   ═══════════════════════════════════════════════════ */
function Services() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
      const ctx = gsap.context(() => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll(".service-card");
      gsap.from(cards, {
        y: 80,
        opacity: 0,
        scale: 0.9,
        rotateX: 8,
        filter: "blur(6px)",
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 95%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  const services = [
    { icon: HeartPulse, t: "Interventional Cardiology", d: "Angioplasty, stenting and complex PCI performed by expert interventional teams.", href: "/specialties/interventional-cardiology" },
    { icon: Activity, t: "Diagnostic Cardiology", d: "ECG, Echo, TMT, Holter and advanced non-invasive cardiac diagnostics.", href: "/specialties/diagnostic-cardiology" },
    { icon: Stethoscope, t: "Cardiac Surgery", d: "CABG, valve replacement and minimally invasive cardiac surgery.", href: "/specialties/cardiac-surgery" },
    { icon: Syringe, t: "Electrophysiology", d: "Pacemaker implants, ICDs and radiofrequency ablation for arrhythmias.", href: "/specialties/electrophysiology" },
    { icon: Ambulance, t: "Emergency Services", d: "24×7 chest-pain response with door-to-balloon protocols under 60 minutes.", href: "/specialties/emergency" },
    { icon: Users, t: "Preventive Cardiology", d: "Cardiac wellness, lipid clinic and personalised heart-risk programs.", href: "/specialties/preventive-cardiology" },
  ];
  return (
    <section id="services" className="relative overflow-hidden bg-[oklch(0.98_0.008_250)] py-12 lg:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-2xl">
          <SectionEyebrow>What we do</SectionEyebrow>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Comprehensive heart care under <span className="grad-text">one roof</span>.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            From the first ECG to the final follow-up, every step of the cardiac journey is designed
            around outcomes, dignity and speed.
          </p>
        </Reveal>

        <div ref={gridRef} className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3" style={{ perspective: "1200px" }}>
          {services.map((s) => (
            <Link to={s.href} key={s.t} className="service-card block group relative h-full overflow-hidden rounded-3xl border border-border bg-white p-8 transition-shadow transition-colors duration-300 hover:shadow-2xl hover:border-[oklch(0.42_0.18_265)]/30 cursor-pointer" style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-[oklch(0.62_0.15_210_/0.15)] to-transparent transition-transform duration-700 group-hover:scale-[1.5]" />
              <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.4_0.18_265)] to-[oklch(0.62_0.15_210)] text-white shadow-luxe transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[oklch(0.42_0.18_265)]">
                Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   TECHNOLOGY — parallax image cards
   ═══════════════════════════════════════════════════ */
function Technology() {
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
      const ctx = gsap.context(() => {
      if (!cardsRef.current) return;
      const cards = cardsRef.current.querySelectorAll(".tech-card");
      cards.forEach((card, i) => {
        gsap.from(card, {
          y: 100,
          opacity: 0,
          scale: 0.88,
          duration: 1.1,
          ease: "power3.out",
          delay: i * 0.15,
          scrollTrigger: {
            trigger: card,
            start: "top 95%",
            once: true,
          },
        });

        /* Parallax on each card's image */
        const img = card.querySelector("img");
        if (img) {
          gsap.to(img, {
            yPercent: 15,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.3,
            },
          });
        }
      });
    });
    return () => ctx.revert();
  }, []);

  const tech = [
    { img: cathlab, t: "Cath Lab", d: "Flat-panel Philips Azurion cath lab for precision interventions." },
    { img: icu, t: "Cardiac ICU", d: "12-bed critical care unit with central monitoring and negative-pressure isolation." },
    { img: ot, t: "Modular OT", d: "HEPA-filtered laminar-flow operation theatre with hybrid capability." },
  ];
  return (
    <section id="technology" className="relative overflow-hidden bg-[oklch(0.12_0.04_265)] py-12 text-white lg:py-10">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
        <div className="absolute -left-24 top-24 h-96 w-96 rounded-full bg-[oklch(0.5_0.18_210_/0.3)] blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[oklch(0.55_0.22_20_/0.25)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-6 lg:grid-cols-3 lg:items-end">
          <Reveal className="lg:col-span-2" variant="fade-left">
            <SectionEyebrow tone="dark">Advanced technology</SectionEyebrow>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
              Precision engineered, <span className="grad-text-light">to the millimetre</span>.
            </h2>
          </Reveal>
          <Reveal variant="fade-right">
            <p className="text-white/70">
              We invest in the tools that shorten procedures, reduce risk and speed recovery — because
              minutes matter when the heart is involved.
            </p>
          </Reveal>
        </div>

        <div ref={cardsRef} className="mt-14 grid gap-6 md:grid-cols-3">
          {tech.map((t) => (
            <article key={t.t} className="tech-card group relative overflow-hidden rounded-3xl border border-white/10">
              <img src={t.img} alt={t.t} width={1400} height={1000} loading="lazy" className="h-72 w-full object-cover transition duration-700 group-hover:scale-105" style={{ willChange: "transform" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.1_0.04_265)] via-[oklch(0.1_0.04_265_/0.4)] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-display text-2xl font-semibold">{t.t}</h3>
                <p className="mt-2 text-sm text-white/75">{t.d}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   DOCTOR SPOTLIGHT — Featured Chief Cardiologist
   ═══════════════════════════════════════════════════ */
function Doctors() {
  const cardRef = useRef<HTMLDivElement>(null);

  // Founding Chief Interventional Cardiologist
  const defaultLeadDoc = {
    img: doc3,
    n: "Dr. Prakash Chand Shahi",
    r: "Director & Senior Interventional Cardiologist",
    degrees: "MBBS (GSVM) · MD Medicine (KGMU) · DM Cardiology (PGIMER, Chandigarh)",
    exp: "22+ Years",
    bio: "Pioneering advanced cardiac care in Eastern Uttar Pradesh, Dr. Prakash Chand Shahi brings over two decades of distinguished clinical and interventional mastery. Specializing in complex coronary angioplasties via radial approach, permanent pacemaker implantations, and emergency cardiac interventions.",
  };

  const { data: dbDoctors } = useQuery({
    queryKey: ["public-doctors"],
    queryFn: () => listPublicDoctorsFn(),
    staleTime: 1000,
    refetchOnMount: true,
  });

  const dbWithPhoto = (dbDoctors ?? []).filter((d) => !!d.photoUrl);
  const primaryDbDoctor = (dbDoctors ?? []).find(
    (d) => d.id === "doc-prakash" || d.name?.toLowerCase().includes("prakash")
  ) || (dbDoctors && dbDoctors.length > 0 ? dbDoctors[0] : null);

  const leadDoc = {
    img: primaryDbDoctor?.photoUrl || defaultLeadDoc.img,
    n: primaryDbDoctor?.name || defaultLeadDoc.n,
    r: primaryDbDoctor?.specialty || defaultLeadDoc.r,
    degrees: defaultLeadDoc.degrees,
    exp: primaryDbDoctor ? `${primaryDbDoctor.experienceYears}+ Years` : defaultLeadDoc.exp,
    bio: primaryDbDoctor?.bio || defaultLeadDoc.bio,
  };

  const isMultiple = (dbDoctors ?? []).length > 1;

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
    const ctx = gsap.context(() => {
      if (!cardRef.current) return;
      gsap.from(cardRef.current, {
        y: 60,
        opacity: 0,
        scale: 0.95,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 90%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section id="doctors" className="relative overflow-hidden py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal variant="fade-left">
            <SectionEyebrow>Chief Cardiologist</SectionEyebrow>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
              Cardiologist you can <span className="grad-text">trust with a lifetime</span>.
            </h2>
            <p className="mt-3 max-w-xl text-base text-muted-foreground">
              Direct clinical leadership, cutting-edge catheterization technology, and compassionate patient-first cardiac interventions.
            </p>
          </Reveal>
          <AppointmentModal>
            <button className="btn-lux inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 transition-all cursor-pointer">
              <Calendar className="h-4 w-4" /> Book Consultation <ChevronRight className="h-4 w-4" />
            </button>
          </AppointmentModal>
        </div>

        {/* Featured Doctor Luxury Card */}
        <div
          ref={cardRef}
          className="mt-12 relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] border border-border/80 bg-gradient-to-br from-card/95 via-card/60 to-background p-4 sm:p-8 lg:p-12 shadow-2xl backdrop-blur-xl"
        >
          {/* Ambient Lighting Gradients */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
          <div className="pointer-events-none absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-[oklch(0.55_0.22_20)]/10 blur-[120px]" />

          <div className="relative z-10 grid gap-8 sm:gap-10 lg:grid-cols-12 lg:items-center">
            {/* Visual Column */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="group relative aspect-[3/4] w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl sm:rounded-[2.2rem] border border-white/15 bg-black shadow-2xl transition-all duration-500 hover:shadow-primary/25">
                <img
                  src={leadDoc.img}
                  alt={leadDoc.n}
                  width={800}
                  height={1000}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

                {/* Available Status Pill */}
                <div className="absolute left-3 top-3 sm:left-4 sm:top-4 flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-semibold tracking-wide text-white backdrop-blur-md shadow-lg">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Available for Consultations
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute inset-x-2.5 bottom-2.5 sm:inset-x-4 sm:bottom-4 rounded-xl sm:rounded-2xl border border-white/10 bg-black/60 sm:bg-white/10 p-2.5 sm:p-4 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-white/70 truncate">
                        Clinical Director
                      </p>
                      <h4 className="font-display text-sm sm:text-base md:text-lg font-bold text-white truncate drop-shadow-sm">
                        {leadDoc.n}
                      </h4>
                    </div>
                    <span className="shrink-0 rounded-lg sm:rounded-xl bg-primary px-2.5 py-1 text-[11px] sm:text-xs font-bold text-white shadow-sm whitespace-nowrap">
                      {leadDoc.exp}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details & Credentials Column */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold tracking-wide text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Chief Interventional Cardiologist
                </div>
                <h3 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                  {leadDoc.n}
                </h3>
                <p className="mt-2 text-base sm:text-lg font-semibold text-primary">
                  {leadDoc.r}
                </p>
                <p className="mt-1 text-xs sm:text-sm font-medium tracking-wide text-muted-foreground">
                  {leadDoc.degrees}
                </p>
              </div>

              {/* Bio Narrative */}
              <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                {leadDoc.bio}
              </p>

              {/* Key Clinical Focus Badges */}
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Complex Coronary Angioplasty",
                    desc: "Radial & femoral PCI with cutting-edge drug-eluting stents.",
                    icon: HeartPulse,
                  },
                  {
                    title: "Pacemakers & Rhythm Devices",
                    desc: "Single/dual chamber pacemakers, AICD & CRT implants.",
                    icon: Activity,
                  },
                  {
                    title: "24×7 Emergency Primary PCI",
                    desc: "Rapid door-to-balloon acute heart attack management.",
                    icon: Shield,
                  },
                  {
                    title: "Heart Failure & Critical Care",
                    desc: "Advanced guideline-directed cardiac therapy & ICU care.",
                    icon: Stethoscope,
                  },
                ].map((spec) => {
                  const Icon = spec.icon;
                  return (
                    <div
                      key={spec.title}
                      className="group/item flex items-start gap-3.5 rounded-2xl border border-border/60 bg-muted/30 p-3.5 transition-all duration-300 hover:border-primary/40 hover:bg-muted/60"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover/item:bg-primary group-hover/item:text-primary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h5 className="font-display text-sm font-semibold text-foreground">{spec.title}</h5>
                        <p className="text-xs text-muted-foreground leading-snug mt-0.5">{spec.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Milestones / Stats Row */}
              <div className="grid grid-cols-3 gap-3 border-y border-border/60 py-4">
                <div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">22+</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Years Experience</div>
                </div>
                <div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">15,000+</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Cardiac Procedures</div>
                </div>
                <div>
                  <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">24×7</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Emergency Availability</div>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <AppointmentModal>
                  <button className="btn-lux inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:bg-primary/90 transition-all cursor-pointer">
                    <Calendar className="h-4 w-4" /> Book Consultation with Dr. Shahi <ArrowRight className="h-4 w-4" />
                  </button>
                </AppointmentModal>
                <a
                  href="tel:+919876510001"
                  className="btn-lux inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-5 py-3 text-sm font-medium text-foreground hover:bg-muted transition-all"
                >
                  <Phone className="h-4 w-4 text-primary" /> Emergency / OPD Line
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   JOURNEY — SVG timeline that draws on scroll
   ═══════════════════════════════════════════════════ */
function Journey() {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<SVGLineElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
      const ctx = gsap.context(() => {
      /* Vertical line draws on scroll */
      if (lineRef.current && sectionRef.current) {
        const length = lineRef.current.getTotalLength?.() || 500;
        gsap.set(lineRef.current, { strokeDasharray: length, strokeDashoffset: length });
        gsap.to(lineRef.current, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            end: "bottom 50%",
            scrub: 0.5,
          },
        });
      }

      /* Steps reveal progressively */
      if (stepsRef.current) {
        const steps = stepsRef.current.querySelectorAll(".journey-step");
        steps.forEach((step, i) => {
          gsap.from(step, {
            x: i % 2 === 0 ? -60 : 60,
            opacity: 0,
            filter: "blur(8px)",
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: step,
              start: "top 95%",
              once: true,
            },
          });
        });
      }
    });
    return () => ctx.revert();
  }, []);

  const steps = [
    { t: "Consultation", d: "A relaxed conversation with your cardiologist — history, symptoms, family risk." },
    { t: "Diagnostics", d: "ECG, echo and imaging under one roof — usually the same day." },
    { t: "Personalised plan", d: "A treatment plan tailored to your heart, lifestyle and goals." },
    { t: "Procedure & care", d: "Intervention or surgery followed by dedicated cardiac ICU recovery." },
    { t: "Follow-up & wellness", d: "Structured cardiac rehab and long-term follow-up you can rely on." },
  ];
  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[oklch(0.98_0.008_250)] py-12 lg:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-2xl">
          <SectionEyebrow>Patient journey</SectionEyebrow>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
            From your first heartbeat with us, <span className="grad-text">to a lifetime of them</span>.
          </h2>
        </Reveal>

        <div className="relative mt-14">
          {/* SVG vertical timeline line */}
          <svg className="absolute left-6 top-0 hidden h-full w-2 md:block" aria-hidden>
            <line
              ref={lineRef}
              x1="4" y1="0" x2="4" y2="100%"
              stroke="url(#journey-grad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="journey-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="oklch(0.55 0.22 20)" />
                <stop offset="1" stopColor="oklch(0.42 0.18 265)" />
              </linearGradient>
            </defs>
          </svg>

          <ol ref={stepsRef} className="relative grid gap-6 md:pl-16">
            {steps.map((s, i) => (
              <li key={s.t} className="journey-step relative h-full rounded-3xl border border-border bg-white p-6">
                {/* Dot on timeline */}
                <div className="absolute -left-[3.25rem] top-6 hidden h-5 w-5 items-center justify-center md:flex">
                  <div className="h-3 w-3 rounded-full bg-gradient-to-br from-[oklch(0.55_0.22_20)] to-[oklch(0.42_0.18_265)] shadow-crimson" />
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.55_0.22_20)] to-[oklch(0.42_0.18_265)] font-display text-sm font-bold text-white">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   STATS — animated counters
   ═══════════════════════════════════════════════════ */
function Stats() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
      const ctx = gsap.context(() => {
      if (!sectionRef.current) return;
      const items = sectionRef.current.querySelectorAll(".stat-item");
      gsap.from(items, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 95%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  const stats = [
    { val: 25000, suffix: "+", label: "Procedures" },
    { val: 120, suffix: "+", label: "Expert staff" },
    { val: 98.6, suffix: "%", label: "Success rate" },
    { val: 20, suffix: "+", label: "Years of care" },
  ];
  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-[oklch(0.12_0.04_265)] py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-item flex flex-col gap-2 border-l border-white/10 pl-6">
            <AnimatedCounter
              value={s.val}
              suffix={s.suffix}
              duration={2.2}
              className="font-display text-5xl font-bold grad-text-light tabular-nums tracking-tight"
            />
            <div className="text-sm uppercase tracking-[0.22em] text-white/60">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   TESTIMONIALS — staggered reveals
   ═══════════════════════════════════════════════════ */
function Testimonials() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
      const ctx = gsap.context(() => {
      if (!gridRef.current) return;
      const cards = gridRef.current.children;
      gsap.from(cards, {
        y: 60,
        opacity: 0,
        rotateY: 5,
        scale: 0.95,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 95%",
          once: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  const items = [
    { n: "Ramesh K.", r: "Angioplasty patient", q: "Dr. Prakash Chand Shahi and the hospital staff gave my father a second life. The care, the discipline, the warmth — it stays with you." },
    { n: "Anjali S.", r: "Angioplasty patient", q: "From the emergency call to going home in three days, everything felt calm and controlled." },
    { n: "Prof. D. Mishra", r: "Pacemaker patient", q: "A hospital that respects your time and your heart, in that order." },
  ];
  return (
    <section id="stories" className="relative overflow-hidden py-12 lg:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-2xl" variant="fade-up">
          <SectionEyebrow>Patient stories</SectionEyebrow>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
            The stories that <span className="grad-text">keep our hearts beating</span>.
          </h2>
        </Reveal>

        <div ref={gridRef} className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <figure key={t.n} className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-sm transition-shadow transition-colors duration-300 hover:shadow-2xl hover:border-[oklch(0.62_0.15_210)]/30 cursor-pointer">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-[oklch(0.62_0.15_210_/0.15)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative">
                <Quote className="h-10 w-10 text-[oklch(0.62_0.15_210)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" />
                <blockquote className="mt-6 text-lg leading-relaxed text-foreground/90 transition-colors duration-300 group-hover:text-foreground">
                  "{t.q}"
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-4 border-t border-border pt-6 transition-colors duration-300 group-hover:border-[oklch(0.62_0.15_210)]/20">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[oklch(0.98_0.008_250)] text-lg font-bold text-[oklch(0.62_0.15_210)] transition-colors duration-300 group-hover:bg-[oklch(0.62_0.15_210)] group-hover:text-white">
                    {t.n.charAt(0)}
                  </div>
                  <div>
                    <div className="font-display font-semibold transition-colors duration-300 group-hover:text-[oklch(0.42_0.18_265)]">{t.n}</div>
                    <div className="text-sm text-muted-foreground">{t.r}</div>
                  </div>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   CALCULATORS
   ═══════════════════════════════════════════════════ */
function Calculators() {
  const [h, setH] = useState(170);
  const [w, setW] = useState(70);
  const bmi = w / ((h / 100) * (h / 100));
  const status =
    bmi < 18.5 ? "Underweight" : bmi < 25 ? "Healthy range" : bmi < 30 ? "Overweight" : "Obese";

  const [age, setAge] = useState(45);
  const [smoker, setSmoker] = useState(false);
  const [bp, setBp] = useState(130);
  const [chol, setChol] = useState(200);
  const risk = Math.min(
    99,
    Math.round(
      (age * 0.4) +
        (smoker ? 15 : 0) +
        (bp > 130 ? (bp - 130) * 0.6 : 0) +
        (chol > 200 ? (chol - 200) * 0.15 : 0),
    ),
  );

  return (
    <section className="relative overflow-hidden bg-[oklch(0.98_0.008_250)] py-12 lg:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-2xl">
          <SectionEyebrow>Health tools</SectionEyebrow>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Know your numbers. <span className="grad-text">Own your heart</span>.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal variant="fade-left">
            <div className="rounded-3xl border border-border bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">BMI calculator</div>
                  <h3 className="mt-1 font-display text-2xl font-semibold">Body Mass Index</h3>
                </div>
                <div className="text-right">
                  <div className="font-display text-4xl font-bold grad-text">{bmi.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">{status}</div>
                </div>
              </div>
              <div className="mt-8 grid gap-6">
                <Field label={`Height · ${h} cm`}>
                  <input type="range" min={130} max={210} value={h} onChange={(e) => setH(+e.target.value)} className="w-full accent-[oklch(0.42_0.18_265)]" />
                </Field>
                <Field label={`Weight · ${w} kg`}>
                  <input type="range" min={35} max={150} value={w} onChange={(e) => setW(+e.target.value)} className="w-full accent-[oklch(0.42_0.18_265)]" />
                </Field>
              </div>
            </div>
          </Reveal>

          <Reveal variant="fade-right">
            <div className="rounded-3xl border border-border bg-gradient-to-br from-[oklch(0.14_0.05_265)] to-[oklch(0.2_0.06_265)] p-8 text-white shadow-luxe">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-white/60">Heart risk score</div>
                  <h3 className="mt-1 font-display text-2xl font-semibold">Cardiac Risk Estimator</h3>
                </div>
                <div className="text-right">
                  <div className="font-display text-4xl font-bold grad-text-light">{risk}%</div>
                  <div className="text-xs text-white/60">indicative only</div>
                </div>
              </div>
              <div className="mt-8 grid gap-6">
                <Field dark label={`Age · ${age} yrs`}>
                  <input type="range" min={20} max={80} value={age} onChange={(e) => setAge(+e.target.value)} className="w-full accent-[oklch(0.7_0.22_20)]" />
                </Field>
                <Field dark label={`Blood pressure · ${bp} mmHg`}>
                  <input type="range" min={100} max={180} value={bp} onChange={(e) => setBp(+e.target.value)} className="w-full accent-[oklch(0.7_0.22_20)]" />
                </Field>
                <Field dark label={`Cholesterol · ${chol} mg/dL`}>
                  <input type="range" min={140} max={300} value={chol} onChange={(e) => setChol(+e.target.value)} className="w-full accent-[oklch(0.7_0.22_20)]" />
                </Field>
                <label className="flex items-center gap-3 text-sm text-white/80">
                  <input type="checkbox" checked={smoker} onChange={(e) => setSmoker(e.target.checked)} className="h-4 w-4 accent-[oklch(0.7_0.22_20)]" />
                  I currently smoke tobacco
                </label>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
function Field({ label, children, dark = false }: { label: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div>
      <div className={`mb-2 text-xs uppercase tracking-[0.22em] ${dark ? "text-white/60" : "text-muted-foreground"}`}>{label}</div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   APPOINTMENT
   ═══════════════════════════════════════════════════ */
function Appointment() {
  const queryClient = useQueryClient();
  const [sent, setSent] = useState(false);
  const [activeTab, setActiveTab] = useState<"book" | "status">("book");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const { data: publicDoctors = [] } = useQuery({
    queryKey: ["public-doctors"],
    queryFn: () => listPublicDoctorsFn(),
  });

  const DEFAULT_DEPARTMENTS = ["Diagnostics"];
  const departments = Array.from(
    new Set([...DEFAULT_DEPARTMENTS, ...publicDoctors.map((d) => d.department).filter((dept) => dept && dept !== "Cardiology")])
  );
  const filteredDoctors = publicDoctors;

  useEffect(() => {
    if (publicDoctors.length > 0) {
      if (!selectedDept && departments.length > 0) {
        setSelectedDept(departments[0]);
      }
      if (!selectedDoctorId && publicDoctors.length > 0) {
        setSelectedDoctorId(publicDoctors[0].id);
      }
    }
  }, [publicDoctors, selectedDept, selectedDoctorId, departments]);

  const handleDepartmentChange = (dept: string) => {
    setSelectedDept(dept);
    const matched = publicDoctors.filter((d) => !dept || d.department === dept);
    const firstDoc = matched.length > 0 ? matched[0] : publicDoctors[0];
    if (firstDoc) {
      setSelectedDoctorId(firstDoc.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const email = (formData.get("email") as string) || "";
    const ageStr = (formData.get("age") as string) || "30";
    const gender = ((formData.get("gender") as string) || "Male") as "Male" | "Female" | "Other";
    const age = parseInt(ageStr, 10) || 30;
    const date = (formData.get("date") as string) || new Date().toISOString().slice(0, 10);
    const address = (formData.get("address") as string) || "";
    const state = (formData.get("state") as string) || "Uttar Pradesh";
    const country = (formData.get("country") as string) || "India";
    const type = (formData.get("type") as string) || "normal";

    const doctor = publicDoctors.find((d) => d.id === selectedDoctorId);

    try {
      await createPublicAppointmentFn({
        data: {
          patientName: name,
          phone,
          email,
          age,
          gender,
          department: selectedDept || "Diagnostics",
          doctorId: selectedDoctorId || doctor?.id || "",
          date,
          address,
          state,
          country,
        },
      });

      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["all-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-overview"] });
      toast.success("Appointment request submitted successfully!");

      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone) {
        const existing = JSON.parse(localStorage.getItem("pulse_bookings") || "{}");
        existing[cleanPhone] = {
          status: "pending",
          timestamp: Date.now(),
          doctorName: doctor?.name,
        };
        localStorage.setItem("pulse_bookings", JSON.stringify(existing));
      }

      setSent(true);
    } catch (err: any) {
      console.error("Booking error:", err);
      alert(err.message || "Failed to book appointment.");
    }
  };

  return (
    <section id="appointment" className="relative overflow-hidden py-12 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <Reveal variant="fade-left">
          <SectionEyebrow>Appointments</SectionEyebrow>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Take the first step. <br /> <span className="grad-text">We'll take the next hundred.</span>
          </h2>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Share a few details and we will confirm your consultation with Dr. Prakash Chand Shahi within the hour.
            Or track your existing appointment status.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <InfoTile icon={Phone} title="Emergency" value="24/7 Helpline" />
            <InfoTile icon={MapPin} title="Location" value="Betiahata, Gorakhpur" />
            <InfoTile icon={Clock} title="Timing" value="Open 24 Hours" />
          </div>
        </Reveal>

        <Reveal variant="fade-right">
          <div className="mb-6 flex overflow-hidden rounded-full border border-border bg-muted/50 p-1">
            <button
              onClick={() => setActiveTab("book")}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${
                activeTab === "book" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Book Appointment
            </button>
            <button
              onClick={() => setActiveTab("status")}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-all ${
                activeTab === "status" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Check Status
            </button>
          </div>

          {activeTab === "book" ? (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-8 shadow-luxe">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" name="name" required />
                <Input label="Phone" name="phone" type="tel" required />

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Age (Years)</label>
                  <input
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    required
                    placeholder="e.g. 30"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Gender</label>
                  <select
                    name="gender"
                    required
                    defaultValue="Male"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <Input label="Email" name="email" type="email" className="sm:col-span-2" />

                <div className="sm:col-span-1">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Department</label>
                  <select
                    value={selectedDept}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Doctor</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring font-medium text-primary"
                  >
                    {filteredDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <Input label="Preferred date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="sm:col-span-2" />
                
                <div className="col-span-1">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Type</label>
                  <select
                    name="type"
                    required
                    defaultValue="normal"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  >
                    <option value="normal">Normal</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                
                <div className="col-span-1">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">State</label>
                  <select
                    name="state"
                    required
                    defaultValue="Uttar Pradesh"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  >
                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Dadra and Nagar Haveli">Dadra and Nagar Haveli</option>
                    <option value="Daman and Diu">Daman and Diu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Lakshadweep">Lakshadweep</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Puducherry">Puducherry</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>
                
                <div className="col-span-1">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Country</label>
                  <select
                    name="country"
                    required
                    defaultValue="India"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  >
                    <option value="India">India</option>
                    <option value="Nepal">Nepal</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Address</label>
                  <textarea name="address" rows={2} required placeholder="Full Address..." className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring" />
                </div>

              </div>
              <button
                type="submit"
                disabled={sent}
                className="btn-lux mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.42_0.18_265)] to-[oklch(0.62_0.15_210)] px-6 py-3.5 text-sm font-semibold text-white shadow-glow"
              >
                {sent ? "Request received ✓" : "Request appointment"}
                {!sent && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          ) : (
            <div className="rounded-3xl border border-border bg-card p-8 shadow-luxe min-h-[450px]">
              <AppointmentStatus />
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
function Input({ label, className = "", ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</label>
      <input {...rest} className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-ring" />
    </div>
  );
}
function InfoTile({ icon: Icon, title, value }: { icon: React.ComponentType<{ className?: string }>; title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[oklch(0.42_0.18_265)] to-[oklch(0.62_0.15_210)] text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
          <div className="font-display font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════ */
function FAQ() {
  const faqs = [
    { q: "Do you handle cardiac emergencies 24×7?", a: "Yes. Our emergency and cath-lab team is on-site 24×7 with door-to-balloon protocols under 60 minutes." },
    { q: "Are cashless insurance and Ayushman Bharat accepted?", a: "We accept all major insurance providers and Ayushman Bharat with dedicated desks for paperwork." },
    { q: "Can I get a second opinion online?", a: "Absolutely. Our tele-cardiology service offers structured second opinions with your reports." },
    { q: "Do you offer cardiac rehab after procedures?", a: "A full cardiac rehab program with physiotherapy, diet and lifestyle support is included for eligible patients." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative overflow-hidden bg-[oklch(0.98_0.008_250)] py-12 lg:py-10">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-12">
        <Reveal className="lg:col-span-5" variant="fade-left">
          <SectionEyebrow>Frequently asked</SectionEyebrow>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
            The answers, <span className="grad-text">before the questions</span>.
          </h2>
          <p className="mt-5 text-muted-foreground">
            Can't find what you need? Our clinic helpline is one call away.
          </p>
        </Reveal>
        <Reveal className="lg:col-span-7" variant="fade-right">
          <ul className="divide-y divide-border rounded-3xl border border-border bg-white">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              return (
                <li key={f.q}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 p-6 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display text-lg font-semibold">{f.q}</span>
                    {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                  </button>
                  <div
                    className="grid overflow-hidden px-6 text-muted-foreground transition-all duration-500"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="min-h-0">
                      <p className="pb-6">{f.a}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   CONTACT
   ═══════════════════════════════════════════════════ */
function Contact() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: settings } = useQuery({
    queryKey: ["hospital-settings"],
    queryFn: () => getHospitalSettingsFn(),
  });

  const hospitalName = settings?.hospitalName || "Pulse Heart Centre";
  const helplinePhone = settings?.helplinePhone || "+91 98765 43210";
  const secondaryPhone = settings?.secondaryPhone || "";
  const contactEmail = settings?.contactEmail || "care@pulseheart.in";
  const address = settings?.address || "Infront of Gangotri Nursing School Awas Vikas Colony, Betiahata, Gorakhpur, UP 273001";

  useEffect(() => {
    if (window.matchMedia("(max-width: 768px)").matches) return;
      const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 95%",
          once: true,
        }
      });

      tl.from(".contact-anim", {
        y: 60,
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        filter: "blur(10px)",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="contact" ref={containerRef} className="relative overflow-hidden bg-[oklch(0.98_0.008_250)] py-32 text-foreground">
      {/* Light Premium ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="contact-anim absolute left-0 top-0 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[oklch(0.62_0.15_210)]/5 blur-[120px]" />
        <div className="contact-anim absolute bottom-0 right-0 h-[600px] w-[600px] translate-x-1/3 translate-y-1/3 rounded-full bg-[oklch(0.4_0.18_265)]/5 blur-[100px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="contact-anim flex flex-col items-center text-center">
          <SectionEyebrow>Contact Us</SectionEyebrow>
          <h2 className="mt-6 font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            We're here for <span className="grad-text">your heart</span>.
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Reach out for appointments, emergency support, or a second opinion. Our specialists are ready to guide you 24/7.
          </p>
        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-12">
          {/* Form Side (Left) */}
          <div className="contact-anim relative overflow-hidden flex flex-col justify-center rounded-[2.5rem] border border-border bg-white p-8 shadow-xl sm:p-12 lg:col-span-7">
             {/* Subtle internal glows */}
             <div className="pointer-events-none absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[oklch(0.62_0.15_210)]/5 to-[oklch(0.4_0.18_265)]/5 blur-[40px] rounded-full" />
             
            <h3 className="relative z-10 font-display text-3xl font-semibold">Request a callback</h3>
            <p className="relative z-10 mt-2 text-muted-foreground">Fill out your details and our care coordinator will reach out within 15 minutes.</p>
            
            <form className="relative z-10 mt-10 grid gap-x-6 gap-y-6 sm:grid-cols-2" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const name = formData.get('name') || '';
              const phone = formData.get('phone') || '';
              const message = formData.get('message') || '';
              const cleanPhone = helplinePhone.replace(/\s+/g, '');
              const text = encodeURIComponent(`Hello! I would like to request a callback.\n\n*Name:* ${name}\n*Phone:* ${phone}\n*Message:* ${message}`);
              window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
              e.currentTarget.reset();
            }}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Full Name</label>
                <input name="name" required type="text" placeholder="John Doe" className="w-full rounded-2xl border border-border bg-[oklch(0.98_0.008_250)] px-5 py-4 text-foreground placeholder:text-muted-foreground transition-all focus:border-[oklch(0.62_0.15_210)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.15_210)]/20" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Phone Number</label>
                <input name="phone" required type="tel" placeholder="+91 XXXXX XXXXX" className="w-full rounded-2xl border border-border bg-[oklch(0.98_0.008_250)] px-5 py-4 text-foreground placeholder:text-muted-foreground transition-all focus:border-[oklch(0.62_0.15_210)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.15_210)]/20" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-foreground/80">Message</label>
                <textarea name="message" required rows={5} placeholder="Please describe your concern here..." className="w-full appearance-none rounded-2xl border border-border bg-[oklch(0.98_0.008_250)] px-5 py-4 text-foreground transition-all focus:border-[oklch(0.62_0.15_210)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[oklch(0.62_0.15_210)]/20"></textarea>
              </div>
              <button className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[oklch(0.4_0.18_265)] to-[oklch(0.62_0.15_210)] px-8 py-5 text-lg font-semibold text-white shadow-lg shadow-[oklch(0.62_0.15_210)]/25 transition-all hover:scale-[1.02] hover:shadow-[oklch(0.62_0.15_210)]/40 active:scale-95 sm:col-span-2">
                Submit Request
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>

            <div className="relative z-10 mt-10 flex items-center justify-between gap-4 rounded-2xl bg-[oklch(0.98_0.008_250)] p-6 border border-border">
              <div>
                <h4 className="font-display text-xl font-bold text-foreground">Rate Your Experience</h4>
                <p className="mt-1 text-sm text-muted-foreground">We value your feedback. Scan or click to rate us on Google.</p>
              </div>
              <a href="https://shinereviewboost.vercel.app/r/pulse-heart-center-a29626" target="_blank" rel="noopener noreferrer" className="group shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-sm p-1.5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_oklch(0.62_0.15_210_/_0.2)] border border-border">
                  <img src={qrCode} alt="Rate Us" className="h-full w-full object-contain" />
                </div>
              </a>
            </div>
          </div>

          {/* Map & Info Side (Right) */}
          <div className="grid gap-6 lg:col-span-5">
            {/* Unified Map & Address Card */}
            <div className="contact-anim group relative w-full overflow-hidden rounded-[2.5rem] border border-border bg-white shadow-xl">
              <div className="relative h-[240px] w-full overflow-hidden">
                <iframe
                  title={`Map to ${hospitalName}`}
                  src="https://www.google.com/maps?q=26.7389564,83.3639006&output=embed"
                  className="absolute inset-0 h-full w-full opacity-90 transition-all duration-700 grayscale filter group-hover:grayscale-0 group-hover:opacity-100"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute inset-0 bg-[oklch(0.62_0.15_210)]/10 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
              </div>
              <a 
                href="https://www.google.com/maps/place/Dr.+Prakash+Chand+Shahi/@26.7389564,83.3639006,17z/data=!3m1!4b1!4m6!3m5!1s0x399144777e9dd209:0xb457b2d7734a575f!8m2!3d26.7389564!4d83.3639006!16s%2Fg%2F11c1ww5jj4?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="group/address flex flex-col gap-4 border-t border-border bg-white p-6 transition-colors duration-300 hover:bg-[oklch(0.98_0.008_250)] sm:flex-row sm:items-center sm:p-8"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[oklch(0.62_0.15_210)]/10 text-[oklch(0.62_0.15_210)] transition-all duration-300 group-hover/address:scale-110 group-hover/address:bg-[oklch(0.62_0.15_210)]/20">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-display text-lg font-bold text-foreground transition-colors duration-300 group-hover/address:text-[oklch(0.62_0.15_210)]">{hospitalName}</div>
                  <div className="mt-1 max-w-[90%] text-sm font-medium leading-relaxed text-muted-foreground transition-colors duration-300 group-hover/address:text-foreground/80">
                    {address}
                  </div>
                </div>
                <div className="hidden sm:block ml-auto text-[oklch(0.62_0.15_210)] opacity-0 -translate-x-4 transition-all duration-300 group-hover/address:translate-x-0 group-hover/address:opacity-100">
                  <ArrowRight className="h-6 w-6" />
                </div>
              </a>
            </div>
            
            {/* Contact Info Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="contact-anim">
                <a href={`tel:${helplinePhone.replace(/\s+/g, "")}`} className="group flex h-full flex-col items-center justify-center rounded-3xl border border-border bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[oklch(0.62_0.15_210)]/10">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.62_0.15_210)]/10 text-[oklch(0.62_0.15_210)] transition-transform group-hover:scale-110">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">24x7 Helpline</div>
                  <div className="mt-1 font-display text-lg font-bold text-foreground">{helplinePhone}</div>
                </a>
              </div>
              {secondaryPhone && (
                <div className="contact-anim">
                  <a href={`tel:${secondaryPhone.replace(/\s+/g, "")}`} className="group flex h-full flex-col items-center justify-center rounded-3xl border border-border bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[oklch(0.62_0.15_210)]/10">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.62_0.15_210)]/10 text-[oklch(0.62_0.15_210)] transition-transform group-hover:scale-110">
                      <Phone className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Secondary Phone</div>
                    <div className="mt-1 font-display text-lg font-bold text-foreground">{secondaryPhone}</div>
                  </a>
                </div>
              )}
              <div className="contact-anim sm:col-span-2">
                <a href={`mailto:${contactEmail}`} className="group flex h-full flex-col items-center justify-center rounded-3xl border border-border bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[oklch(0.4_0.18_265)]/10">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.4_0.18_265)]/10 text-[oklch(0.4_0.18_265)] transition-transform group-hover:scale-110">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Email Us</div>
                  <div className="mt-1 font-display text-lg font-bold text-foreground">{contactEmail}</div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



/* ═══════════════════════════════════════════════════
   SHARED
   ═══════════════════════════════════════════════════ */
function SectionEyebrow({ children, tone = "light" }: { children: React.ReactNode; tone?: "light" | "dark" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.28em] ${
        tone === "dark"
          ? "border-white/15 bg-white/5 text-white/70"
          : "border-border bg-white text-muted-foreground"
      }`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.22_20)] animate-heartbeat" />
      {children}
    </span>
  );
}
