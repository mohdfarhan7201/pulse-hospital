import { useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { gsap } from "gsap";
import { getHospitalSettingsFn } from "@/lib/api";
import { AppointmentModal } from "@/components/site/AppointmentModal";
import logo1 from "@/assets/logo1.png";
import qrCode from "@/assets/qr.png";
import {
  ArrowRight,
  Facebook,
  Instagram,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

export function Footer() {
  const containerRef = useRef<HTMLElement>(null);

  const { data: settings } = useQuery({
    queryKey: ["hospital-settings"],
    queryFn: () => getHospitalSettingsFn(),
  });

  const hospitalName = settings?.hospitalName || "Pulse Heart Centre";
  const tagline = settings?.tagline || "Setting a new standard in cardiovascular care. We combine cutting-edge technology with compassionate expertise to save lives.";
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

      tl.from(".footer-anim", {
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
    <footer ref={containerRef} className="relative mt-20 bg-[oklch(0.04_0.01_265)] pt-16 text-white/70 overflow-hidden">
      
      {/* Advanced SVG Wave Divider (Not Straight Border) */}
      <div className="pointer-events-none absolute left-0 top-0 z-0 w-full -translate-y-[99%] overflow-hidden leading-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="block h-[60px] w-full text-[oklch(0.04_0.01_265)] md:h-[140px]" preserveAspectRatio="none">
          <path fill="currentColor" d="M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,149.3C672,128,768,128,864,154.7C960,181,1056,235,1152,240C1248,245,1344,203,1392,181.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Embedded Premium CTA Card with Hover Interactivity */}
      <div className="footer-anim relative z-20 mx-auto mb-24 max-w-6xl px-6">
        <div className="group relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[oklch(0.4_0.18_265)] to-[oklch(0.62_0.15_210)] p-12 shadow-2xl shadow-[oklch(0.62_0.15_210)]/20 transition-all duration-500 hover:-translate-y-3 hover:shadow-[oklch(0.62_0.15_210)]/40 sm:p-20">
          {/* Decorative swirls inside CTA that react on hover */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-[60px] transition-transform duration-700 group-hover:scale-150 group-hover:bg-white/20" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-[500px] w-[500px] rounded-full bg-black/10 blur-[60px] transition-transform duration-700 group-hover:scale-110" />
          
          <div className="relative z-10 flex flex-col items-center justify-between gap-10 md:flex-row">
            <div className="text-center transition-transform duration-500 group-hover:translate-x-4 md:text-left">
              <h2 className="font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">Your Heart, <br/>Our Priority.</h2>
              <p className="mt-6 text-xl text-white/80">Book a consultation with our top specialists today.</p>
            </div>
            <AppointmentModal>
              <button className="flex h-14 shrink-0 items-center justify-center gap-3 rounded-full bg-white px-8 text-lg font-bold text-[oklch(0.4_0.18_265)] shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 group-hover:-translate-x-2 cursor-pointer">
                Book Appointment <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </AppointmentModal>
          </div>
        </div>
      </div>

      {/* Main Footer Background Effects & Giant Typography */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-20 w-full text-center">
          <h1 className="select-none font-display text-[22vw] font-bold leading-none tracking-tighter text-white/[0.02] mix-blend-plus-lighter">
            {hospitalName.split(" ")[0] || "PULSE"}
          </h1>
        </div>
        <div className="absolute bottom-0 left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-[oklch(0.62_0.15_210)]/15 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-16 lg:grid-cols-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-start gap-8">
            <div>
              <div className="flex items-center gap-4 text-white">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-[oklch(0.62_0.15_210)] shadow-inner backdrop-blur-xl">
                  <img src={logo1} alt={`${hospitalName} Logo`} className="h-full w-full object-contain p-2" />
                </span>
                <span className="font-display text-4xl font-bold tracking-tight">{hospitalName}</span>
              </div>
              <p className="mt-8 max-w-sm text-lg leading-relaxed text-white/50">
                {tagline}
              </p>
              
              <div className="mt-10 flex gap-4">
                {[
                  { icon: Facebook, label: "Facebook", href: "https://www.facebook.com/profile.php?id=61592479897393" },
                  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/pulse_heartcentre/" },
                ].map((social) => (
                  <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/50 transition-all duration-300 hover:-translate-y-2 hover:border-[oklch(0.62_0.15_210)]/50 hover:bg-[oklch(0.62_0.15_210)]/10 hover:text-[oklch(0.62_0.15_210)] hover:shadow-[0_10px_20px_oklch(0.62_0.15_210_/_0.2)]">
                    <social.icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                ))}
              </div>
            </div>

            <a href="https://shinereviewboost.vercel.app/r/pulse-heart-center-a29626" target="_blank" rel="noopener noreferrer" className="mt-2 sm:mt-16 flex flex-col items-center group/qr">
              <div className="rounded-2xl bg-white p-2 shadow-[0_0_30px_oklch(0.62_0.15_210_/_0.15)] transition-transform duration-300 group-hover/qr:scale-105 group-hover/qr:shadow-[0_0_40px_oklch(0.62_0.15_210_/_0.3)]">
                <img src={qrCode} alt="Scan or Click to Rate Us" className="h-32 w-32 object-contain" />
              </div>
              <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-[oklch(0.62_0.15_210)]">Rate Us</span>
            </a>
          </div>
          
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
            <FooterCol title="Specialties" links={[
              { label: "Interventional Cardiology", href: "/specialties/interventional-cardiology" },
              { label: "Cardiac Surgery", href: "/specialties/cardiac-surgery" },
              { label: "Electrophysiology", href: "/specialties/electrophysiology" },
              { label: "Pediatric Cardiology", href: "/specialties/pediatric-cardiology" },
              { label: "Rehabilitation", href: "/specialties/rehabilitation" }
            ]} />
            <FooterCol title="Hospital" links={[
              { label: "About Us", href: "/#about" },
              { label: "Our Services", href: "/#services" },
              { label: "Technology", href: "/#technology" },
              { label: "Our Doctors", href: "/#doctors" },
              { label: "Patient Stories", href: "/#stories" }
            ]} />
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">Contact</h3>
              <ul className="mt-8 space-y-5">
                <li>
                  <a href={`tel:${helplinePhone.replace(/\s+/g, "")}`} className="group flex items-start gap-3 text-base text-white/60 transition-colors hover:text-white">
                    <Phone className="mt-1 h-5 w-5 shrink-0 text-[oklch(0.62_0.15_210)]" />
                    <span className="whitespace-nowrap">{helplinePhone}</span>
                  </a>
                </li>
                {secondaryPhone && (
                  <li>
                    <a href={`tel:${secondaryPhone.replace(/\s+/g, "")}`} className="group flex items-start gap-3 text-base text-white/60 transition-colors hover:text-white">
                      <Phone className="mt-1 h-5 w-5 shrink-0 text-[oklch(0.62_0.15_210)]" />
                      <span className="whitespace-nowrap">{secondaryPhone}</span>
                    </a>
                  </li>
                )}
                <li>
                  <a href={`mailto:${contactEmail}`} className="group flex items-start gap-3 text-base text-white/60 transition-colors hover:text-white">
                    <Mail className="mt-1 h-5 w-5 shrink-0 text-[oklch(0.62_0.15_210)]" />
                    <span className="whitespace-nowrap">{contactEmail}</span>
                  </a>
                </li>
                <li>
                  <div className="flex items-start gap-3 text-base text-white/60">
                    <MapPin className="mt-1 h-5 w-5 shrink-0 text-[oklch(0.62_0.15_210)]" />
                    <span className="leading-relaxed">{address}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm font-medium text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} {hospitalName}. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed with <HeartPulse className="h-4 w-4 animate-pulse text-[oklch(0.62_0.15_210)]" /> for patient care
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-white">{title}</h3>
      <ul className="mt-8 space-y-5">
        {links.map((l) => (
          <li key={l.label}>
            {l.href.startsWith("#") ? (
              <a className="group flex items-center text-base text-white/60 transition-colors hover:text-white" href={l.href}>
                <span className="relative flex items-center overflow-hidden py-1 pr-8">
                   <ArrowRight className="absolute -left-6 h-5 w-5 text-[oklch(0.62_0.15_210)] opacity-0 transition-all duration-300 group-hover:left-0 group-hover:opacity-100" />
                   <span className="transition-transform duration-300 group-hover:translate-x-8">{l.label}</span>
                </span>
              </a>
            ) : (
              <Link to={l.href} className="group flex items-center text-base text-white/60 transition-colors hover:text-white">
                <span className="relative flex items-center overflow-hidden py-1 pr-8">
                   <ArrowRight className="absolute -left-6 h-5 w-5 text-[oklch(0.62_0.15_210)] opacity-0 transition-all duration-300 group-hover:left-0 group-hover:opacity-100" />
                   <span className="transition-transform duration-300 group-hover:translate-x-8">{l.label}</span>
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
