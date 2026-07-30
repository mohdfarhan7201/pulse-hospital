import { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Info,
  HeartPulse,
  Stethoscope,
  UserCheck,
  CheckCheck,
  AlertCircle,
  ChevronRight,
  User,
  Building2,
} from "lucide-react";
import gsap from "gsap";
import { useQuery } from "@tanstack/react-query";
import { lookupAppointmentStatusFn, getHospitalSettingsFn } from "@/lib/api";

export function AppointmentStatus() {
  const { data: settings } = useQuery({
    queryKey: ["hospital-settings"],
    queryFn: () => getHospitalSettingsFn(),
  });
  const helplinePhone = settings?.helplinePhone || "+91 98765 43210";
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(false);

    try {
      const data = await lookupAppointmentStatusFn({ data: query.trim() });
      setResults(data || []);
      setSelectedIndex(0);
      setSearched(true);
      animateResult();
    } catch (err: any) {
      console.error("Lookup error:", err);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const animateResult = () => {
    requestAnimationFrame(() => {
      gsap.fromTo(
        ".status-result",
        { y: 20, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".status-stagger",
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: "power2.out", delay: 0.1 }
      );
    });
  };

  const resetSearch = () => {
    setQuery("");
    setSearched(false);
    setResults([]);
    setSelectedIndex(0);
  };

  const activeAppt = results[selectedIndex];

  // Map appointment status to visual design (Exact match for user image & multi-status)
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Confirmed":
        return {
          headerGradient: "from-[oklch(0.42_0.18_265)] via-[oklch(0.50_0.16_240)] to-[oklch(0.60_0.15_210)]",
          icon: <CheckCircle2 className="h-5 w-5 text-white" />,
          title: "Appointment Confirmed",
          notes: [
            "Please arrive 15 minutes before your scheduled time.",
            "Bring any previous medical reports or ECGs.",
            "Fasting is not required unless specifically advised.",
          ],
        };

      case "In Consultation":
        return {
          headerGradient: "from-purple-600 via-indigo-600 to-blue-600",
          icon: <Stethoscope className="h-5 w-5 text-white" />,
          title: "In Consultation",
          notes: [
            "Patient is currently inside the consultation room with the doctor.",
            "Please stand by for prescriptions and follow-up advice.",
          ],
        };

      case "Waiting":
        return {
          headerGradient: "from-blue-600 via-cyan-600 to-teal-600",
          icon: <UserCheck className="h-5 w-5 text-white" />,
          title: "Waiting for Doctor",
          notes: [
            "Patient has checked in and is seated in the waiting lounge.",
            "Token numbers will be called sequentially.",
          ],
        };

      case "Completed":
        return {
          headerGradient: "from-emerald-600 via-teal-600 to-cyan-600",
          icon: <CheckCheck className="h-5 w-5 text-white" />,
          title: "Consultation Completed",
          notes: [
            "Your appointment has been successfully completed.",
            "Collect your prescription & billing receipt at the reception desk.",
          ],
        };

      case "Cancelled":
        return {
          headerGradient: "from-rose-600 via-red-600 to-orange-600",
          icon: <AlertCircle className="h-5 w-5 text-white" />,
          title: "Appointment Cancelled",
          notes: [
            "This appointment has been cancelled.",
            `Contact our helpline at ${helplinePhone} for rescheduling.`,
          ],
        };

      case "Pending":
      default:
        return {
          headerGradient: "from-amber-600 via-orange-500 to-yellow-500",
          icon: <Clock className="h-5 w-5 text-white" />,
          title: "Appointment Under Review",
          notes: [
            "Your appointment booking is received and pending hospital desk confirmation.",
            "You will receive an update once confirmed.",
          ],
        };
    }
  };

  return (
    <div className="flex w-full flex-col">
      {!searched && (
        <>
          <h3 className="font-display text-xl font-bold tracking-tight">Check Appointment Status</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter registered mobile number or appointment ID to view live status.
          </p>

          <form onSubmit={handleTrack} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Mobile number (e.g. +91 9876543210)"
                className="w-full rounded-2xl border border-input bg-background py-3.5 pl-5 pr-12 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn-lux inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[oklch(0.42_0.18_265)] to-[oklch(0.62_0.15_210)] px-8 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? "Searching…" : "Track Status"}
            </button>
          </form>
        </>
      )}

      {/* Result Display Area */}
      {searched && (
        <div className="w-full">
          {results.length === 0 ? (
            <div className="status-result flex flex-col items-center justify-center rounded-3xl border border-border bg-muted/30 p-8 text-center">
              <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
                <Search className="h-8 w-8 opacity-50" />
              </div>
              <div className="font-display text-lg font-bold">No Booking Found</div>
              <p className="mt-2 max-w-xs text-xs text-muted-foreground">
                No active appointments found for "{query}". Please check the phone number or book a new appointment.
              </p>
              <button
                onClick={resetSearch}
                className="mt-5 rounded-full border border-border bg-background px-6 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Try Another Number
              </button>
            </div>
          ) : (
            <div>
              {/* If multiple bookings exist for same phone number */}
              {results.length > 1 && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Select Booking:</span>
                  {results.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedIndex(idx);
                        animateResult();
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        selectedIndex === idx
                          ? "bg-primary text-primary-foreground shadow"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {item.displayId} ({item.date})
                    </button>
                  ))}
                </div>
              )}

              {/* Exact Card Design matching User Image */}
              {activeAppt && (() => {
                const config = getStatusConfig(activeAppt.status);

                return (
                  <div className="status-result relative overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
                    {/* Top Status Gradient Banner */}
                    <div className={`bg-gradient-to-r ${config.headerGradient} px-6 py-4.5 text-white flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                          {config.icon}
                        </div>
                        <span className="font-display text-lg font-bold tracking-wide">
                          {config.title}
                        </span>
                      </div>
                    </div>

                    {/* Main Details Area */}
                    <div className="p-6 space-y-5">
                      {/* Appointment ID & Token Box */}
                      <div className="status-stagger grid gap-4 rounded-2xl border border-border bg-muted/30 p-5 sm:grid-cols-2">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            APPOINTMENT ID
                          </div>
                          <div className="mt-1 font-mono text-base font-bold text-foreground tracking-tight">
                            {activeAppt.displayId || `#${activeAppt.id}`}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            TOKEN NO.
                          </div>
                          <div className="mt-1 flex items-center">
                            {activeAppt.status === "Confirmed" && activeAppt.tokenNo ? (
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-cyan-500/15 text-sm font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                                {activeAppt.tokenNo}
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-muted-foreground italic">
                                TBD
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="sm:col-span-2 border-t border-border/60 pt-3.5">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            DATE & SLOT
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm font-bold text-foreground">
                            <Calendar className="h-4 w-4 text-cyan-600" />
                            <span>
                              {activeAppt.date} · {activeAppt.status === "Confirmed" && activeAppt.time ? activeAppt.time : "Pending Allotment"}
                            </span>
                          </div>
                        </div>

                        <div className="sm:col-span-2 border-t border-border/60 pt-3.5 grid gap-2 sm:grid-cols-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                              PATIENT NAME
                            </span>
                            <span className="font-semibold text-foreground">{activeAppt.patientName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                              DOCTOR & DEPT
                            </span>
                            <span className="font-semibold text-foreground">
                              {activeAppt.doctorName} ({activeAppt.department})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Key Notes Card */}
                      <div className="status-stagger rounded-2xl bg-muted/30 p-5 border border-border">
                        <div className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4 text-cyan-600" /> Key Notes
                        </div>
                        <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                          {config.notes.map((note: string, i: number) => (
                            <li key={i}>{note}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Footer Branding & Check Another Button */}
                      <div className="status-stagger flex flex-col items-center justify-center gap-4 border-t border-border/60 pt-4">
                        <div className="flex items-center gap-2 opacity-80">
                          <HeartPulse className="h-4 w-4 text-cyan-600" />
                          <span className="font-display text-xs font-bold uppercase tracking-[0.2em] text-foreground">
                            PULSE HEART CENTRE
                          </span>
                        </div>

                        <button
                          onClick={resetSearch}
                          className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-2.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted active:scale-95"
                        >
                          Check another booking
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
