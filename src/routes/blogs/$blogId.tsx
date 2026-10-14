import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  User,
  Film,
  HeartPulse,
  Sparkles,
  Share2,
  CalendarDays,
  ShieldCheck,
  CheckCircle2,
  Award,
  Pencil,
  Youtube,
  Instagram,
  ExternalLink,
} from "lucide-react";

import { getBlogFn, getHospitalSettingsFn } from "@/lib/api";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { AppointmentModal } from "@/components/site/AppointmentModal";
import { parseVideoUrl } from "@/lib/video";

export const Route = createFileRoute("/blogs/$blogId")({
  component: SingleBlogPage,
});

function SingleBlogPage() {
  const { blogId } = Route.useParams();

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", blogId],
    queryFn: () => getBlogFn({ data: blogId }),
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

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-40 text-center px-4 space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Blog post not found</h1>
          <p className="text-sm text-slate-500 mb-4">
            The article you are looking for may have been removed or updated.
          </p>
          <Button asChild className="btn-lux rounded-full bg-slate-900 text-white font-semibold">
            <Link to="/blogs">Back to All Articles</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Extract video info (supports YouTube, Instagram Reels/Posts, Vimeo, direct)
  const videoInfo = parseVideoUrl(blog.videoUrl);

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: blog.title,
          text: `Read this medical health article by Dr. Prakash Chand Shahi: ${blog.title}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const isDirectVideo =
    blog.videoUrl &&
    (blog.videoUrl.startsWith("/uploads/") ||
      blog.videoUrl.startsWith("/api/video/") ||
      blog.videoUrl.match(/\.(mp4|webm|mov)$/i));

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-primary selection:text-white">
      {/* Site Navbar */}
      <Navbar />

      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6">
        <div className="container max-w-4xl mx-auto space-y-8">
          {/* Back Button */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full gap-2 text-xs font-semibold"
            >
              <Link to="/blogs">
                <ArrowLeft className="h-4 w-4" /> Back to all articles
              </Link>
            </Button>
          </div>

          {/* Article Header */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 text-xs font-bold text-cyan-800">
                <Sparkles className="h-3.5 w-3.5" /> Clinical Health Article
              </span>
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
              {blog.title}
            </h1>

            {/* Author Bar & Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                  PS
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none">
                    Dr. Prakash Chand Shahi
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Director &amp; Chief Cardiologist · Pulse Heart Centre
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {videoInfo?.externalUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className={`rounded-full gap-1.5 text-xs font-semibold shadow-sm transition-all ${
                      videoInfo.platform === "youtube"
                        ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                        : videoInfo.platform === "instagram"
                        ? "border-pink-200 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 text-pink-600 hover:from-purple-100 hover:to-pink-100"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <a
                      href={videoInfo.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {videoInfo.platform === "youtube" ? (
                        <Youtube className="h-3.5 w-3.5 fill-current" />
                      ) : videoInfo.platform === "instagram" ? (
                        <Instagram className="h-3.5 w-3.5 text-pink-600" />
                      ) : (
                        <Film className="h-3.5 w-3.5" />
                      )}
                      Watch on {videoInfo.label}
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-full gap-1.5 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  <Link to="/doctor/blogs" search={{ edit: blog.id }}>
                    <Pencil className="h-3.5 w-3.5 text-primary" /> Edit Article
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="rounded-full gap-1.5 text-xs font-semibold border-slate-200 hover:bg-slate-50"
                >
                  <Share2 className="h-3.5 w-3.5" /> Share Article
                </Button>
              </div>
            </div>
          </header>

          {/* Video Player or Cover Image */}
          {videoInfo?.embedUrl ? (
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-950 shadow-2xl">
              <div
                className={
                  videoInfo.platform === "instagram"
                    ? "aspect-[9/16] max-w-md mx-auto w-full bg-black flex items-center justify-center min-h-[500px]"
                    : "aspect-video w-full"
                }
              >
                <iframe
                  src={videoInfo.embedUrl}
                  title={blog.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
              {videoInfo.externalUrl && (
                <div className="bg-slate-900 border-t border-slate-800 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-2">
                    {videoInfo.platform === "youtube" ? (
                      <Youtube className="h-4 w-4 text-red-500 fill-current" />
                    ) : videoInfo.platform === "instagram" ? (
                      <Instagram className="h-4 w-4 text-pink-400" />
                    ) : (
                      <Film className="h-4 w-4 text-cyan-400" />
                    )}
                    <span>
                      Playing from <strong>{videoInfo.label}</strong>
                    </span>
                  </span>
                  <a
                    href={videoInfo.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold transition"
                  >
                    Open on {videoInfo.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          ) : isDirectVideo ? (
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-black shadow-2xl">
              <div className="aspect-video w-full">
                <video
                  src={blog.videoUrl}
                  controls
                  playsInline
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          ) : blog.imageUrl ? (
            <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 shadow-2xl w-full bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[750px]">
              {/* Ambient blurred backdrop so portrait images have a seamless modern glow instead of empty bars */}
              <img
                src={blog.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none"
                aria-hidden="true"
              />
              {/* Full uncropped image, fully visible whether portrait or landscape */}
              <img
                src={blog.imageUrl}
                alt={blog.title}
                className="relative z-10 max-h-[720px] w-auto max-w-full object-contain mx-auto rounded-2xl shadow-sm"
              />
            </div>
          ) : null}

          {/* Article Text Content */}
          <div className="prose prose-slate prose-lg max-w-none space-y-4 text-slate-700 leading-relaxed font-normal">
            {blog.content ? (
              blog.content.split("\n").map((para, i) =>
                para.trim() ? (
                  <p key={i} className="text-base sm:text-lg leading-relaxed">
                    {para}
                  </p>
                ) : null
              )
            ) : (
              <p className="italic text-slate-400">No additional article text provided.</p>
            )}
          </div>

          {/* Consultation CTA Banner */}
          <div className="mt-12 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 sm:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <HeartPulse className="h-3.5 w-3.5" /> Pulse Heart Centre · Gorakhpur
              </div>
              <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                Need expert cardiovascular or diagnostic consultation?
              </h3>
              <p className="text-sm text-slate-600 max-w-lg">
                Book an OPD consultation or diagnostic evaluation with Dr. Prakash Chand Shahi directly.
              </p>
            </div>

            <div className="shrink-0">
              <AppointmentModal initialDepartment="Diagnostics">
                <Button className="btn-lux rounded-full bg-primary text-white hover:bg-primary/90 px-6 py-6 font-semibold shadow-glow">
                  <CalendarDays className="mr-2 h-4 w-4" /> Book Consultation
                </Button>
              </AppointmentModal>
            </div>
          </div>
        </div>
      </main>

      {/* Site Footer */}
      <Footer />
    </div>
  );
}
