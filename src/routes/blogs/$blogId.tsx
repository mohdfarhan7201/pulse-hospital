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
} from "lucide-react";

import { getBlogFn, getHospitalSettingsFn } from "@/lib/api";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { AppointmentModal } from "@/components/site/AppointmentModal";

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

  // Extract YouTube video ID
  let embedVideoUrl: string | null = null;
  if (blog.videoUrl) {
    const ytMatch = blog.videoUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (ytMatch && ytMatch[1]) {
      embedVideoUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    } else {
      const vimeoMatch = blog.videoUrl.match(/vimeo\.com\/(\d+)/);
      if (vimeoMatch && vimeoMatch[1]) {
        embedVideoUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
      }
    }
  }

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
    (blog.videoUrl.startsWith("/uploads/") || blog.videoUrl.match(/\.(mp4|webm|mov)$/i));

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

              <div className="flex items-center gap-2">
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
          {embedVideoUrl ? (
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-black shadow-2xl">
              <div className="aspect-video w-full">
                <iframe
                  src={embedVideoUrl}
                  title={blog.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
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
            <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-xl aspect-video w-full bg-slate-100">
              <img src={blog.imageUrl} alt={blog.title} className="h-full w-full object-cover" />
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
