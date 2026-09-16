import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  User,
  Video,
  HeartPulse,
  Sparkles,
  Share2,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Award,
} from "lucide-react";

import { getVlogFn, getHospitalSettingsFn } from "@/lib/api";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { AppointmentModal } from "@/components/site/AppointmentModal";

export const Route = createFileRoute("/vlogs/$vlogId")({
  component: SingleVlogPage,
});

function SingleVlogPage() {
  const { vlogId } = Route.useParams();

  const { data: vlog, isLoading } = useQuery({
    queryKey: ["vlog", vlogId],
    queryFn: () => getVlogFn({ data: vlogId }),
    staleTime: 60_000,
  });

  const { data: settings } = useQuery({
    queryKey: ["hospital-settings"],
    queryFn: () => getHospitalSettingsFn(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-40">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!vlog) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-40 text-center px-4 space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Vlog post not found</h1>
          <p className="text-sm text-slate-500 mb-4">
            The vlog you are looking for may have been removed or updated.
          </p>
          <Button asChild className="btn-lux rounded-full bg-slate-900 text-white font-semibold">
            <Link to="/vlogs">Back to All Vlogs</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Extract YouTube video ID
  let embedVideoUrl: string | null = null;
  if (vlog.videoUrl) {
    const ytMatch = vlog.videoUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (ytMatch && ytMatch[1]) {
      embedVideoUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    } else {
      const vimeoMatch = vlog.videoUrl.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        embedVideoUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: vlog.title,
          text: `Watch this cardiac health vlog by Dr. Prakash Chand Shahi: ${vlog.title}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-primary selection:text-white flex flex-col">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[radial-gradient(circle,oklch(0.92_0.06_210_/_0.5),transparent_70%)] blur-[90px]" />
        <div className="absolute top-[400px] -right-32 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,oklch(0.95_0.05_20_/_0.35),transparent_70%)] blur-[100px]" />
      </div>

      <Navbar />

      {/* Hero Header */}
      <section className="relative z-10 pt-32 pb-8 md:pt-38 md:pb-12 border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
        <div className="container mx-auto px-5 max-w-4xl space-y-4">
          <Link
            to="/vlogs"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-2 transition-colors py-1.5 px-3 rounded-full bg-slate-100 border border-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to All Vlogs
          </Link>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {new Date(vlog.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Dr. Prakash Chand Shahi
              </span>
              <span>•</span>
              <span className="text-slate-500">Director &amp; Chief Cardiologist</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-slate-900 leading-tight">
              {vlog.title}
            </h1>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-sm"
              >
                <Share2 className="h-3.5 w-3.5" /> Share Case Vlog
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 py-10 md:py-14 px-5">
        <div className="container mx-auto max-w-4xl space-y-8">
          {/* Cinema Video Player Container */}
          {(embedVideoUrl || vlog.videoUrl) && (
            <div className="relative group">
              <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-black aspect-video relative shadow-2xl">
                {embedVideoUrl ? (
                  <iframe
                    src={embedVideoUrl}
                    title={vlog.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={vlog.videoUrl}
                    poster={vlog.imageUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>
          )}

          {/* Photo Display if image only */}
          {vlog.imageUrl && !vlog.videoUrl && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl max-h-[580px] bg-slate-100">
              <img
                src={vlog.imageUrl}
                alt={vlog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content Description Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-10 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold font-display text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Clinical Summary &amp; Patient Advice
              </h3>
              <span className="text-xs font-mono text-slate-400">Pulse Heart Centre</span>
            </div>

            <div className="text-base text-slate-700 leading-relaxed whitespace-pre-wrap font-normal">
              {vlog.content ||
                "Watch the video above for complete clinical insights, surgical demonstrations, and doctor advice."}
            </div>

            {/* Doctor Consultation CTA Card */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mt-8">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                  <HeartPulse className="h-5 w-5 text-crimson" />
                  <span>Consult Dr. Prakash Chand Shahi</span>
                </div>
                <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                  Interventional Cardiologist (MBBS, MD, DM). Providing Eastern UP's highest standard
                  of advanced cardiac care &amp; ICU support.
                </p>
              </div>

              <AppointmentModal>
                <Button className="btn-lux rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-xs px-6 py-2.5 h-10 shrink-0 shadow-md cursor-pointer">
                  <CalendarDays className="h-4 w-4 mr-2" /> Book Consultation
                </Button>
              </AppointmentModal>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
