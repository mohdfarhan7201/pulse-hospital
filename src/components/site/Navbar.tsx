import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogIn, Menu, Phone, X } from "lucide-react";
import logo1 from "@/assets/logo1.png";
import { Link } from "@tanstack/react-router";
import { AppointmentModal } from "@/components/site/AppointmentModal";
import { getHospitalSettingsFn } from "@/lib/api";

const links = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#technology", label: "Technology" },
  { href: "#doctors", label: "Doctors" },
  { href: "#stories", label: "Stories" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["hospital-settings"],
    queryFn: () => getHospitalSettingsFn(),
  });

  const hospitalName = settings?.hospitalName || "Pulse Heart Centre";
  const helplinePhone = settings?.helplinePhone || "+91 98765 43210";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-3" : "py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5">
        <nav
          className={`flex items-center justify-between rounded-2xl px-5 py-3 transition-all duration-500 ${
            scrolled
              ? "glass-dark shadow-luxe"
              : "border border-white/10 bg-white/5 backdrop-blur-md"
          }`}
          aria-label="Primary"
        >
          <a href="#top" className="flex items-center gap-3 text-white">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-crimson">
              <img src={logo1} alt="Hospital Logo" className="h-full w-full object-contain p-1" />
              <span className="absolute inset-0 rounded-xl border border-white/30 animate-pulse-ring" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-base font-bold text-white tracking-wide">
                {hospitalName}
              </span>
            </span>
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            <a
              href={`tel:${helplinePhone.replace(/\s+/g, "")}`}
              className="btn-lux inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              <Phone className="h-4 w-4" /> {helplinePhone}
            </a>
            <Link
              to="/login"
              className="btn-lux inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
            >
              <LogIn className="h-4 w-4" /> Login
            </Link>
            <AppointmentModal>
              <button
                className="btn-lux inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[oklch(0.18_0.05_265)] shadow-glow hover:bg-white/90"
              >
                Book Appointment
              </button>
            </AppointmentModal>
          </div>

          <button
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-white lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <div className={`glass-dark mt-3 rounded-2xl p-4 text-white lg:hidden ${open ? 'block' : 'hidden'}`}>
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10"
                  href={l.href}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <AppointmentModal>
            <button
              onClick={() => setOpen(false)}
              className="mt-3 block w-full rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-[oklch(0.18_0.05_265)]"
            >
              Book Appointment
            </button>
          </AppointmentModal>
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            <LogIn className="h-4 w-4" /> Login
          </Link>
        </div>
      </div>
    </header>
  );
}
