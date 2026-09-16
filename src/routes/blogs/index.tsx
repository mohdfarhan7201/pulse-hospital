import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  BookOpen,
  ArrowRight,
  Play,
  Search,
  Calendar,
  Sparkles,
  HeartPulse,
  Share2,
  Clock,
  UserCheck,
  ImageIcon,
  X,
  Maximize2,
  Film,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";

import { listBlogsFn, type BlogRecord } from "@/lib/api";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/blogs/")({
  component: BlogsPage,
  head: () => ({
    meta: [
      { title: "Health Blogs & Medical Insights · Pulse Heart Centre" },
      {
        name: "description",
        content:
          "Read exclusive health blogs, cardiac care advice, and diagnostic guides written and presented by Dr. Prakash Chand Shahi at Pulse Heart Centre, Gorakhpur.",
      },
    ],
  }),
});

function getYoutubeThumbnail(url?: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }
  return null;
}

function getEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }
  return null;
}

function BlogsPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "video" | "image">("all");
  const [activeModalBlog, setActiveModalBlog] = useState<BlogRecord | null>(null);

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => listBlogsFn(),
    staleTime: 60_000,
  });

  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog: BlogRecord) => {
      const q = search.toLowerCase().trim();
      const matchesQuery =
        !q ||
        blog.title.toLowerCase().includes(q) ||
        (blog.content && blog.content.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      if (filterType === "video") return !!blog.videoUrl;
      if (filterType === "image") return !!blog.imageUrl && !blog.videoUrl;
      return true;
    });
  }, [blogs, search, filterType]);

  const featuredBlog =
    filteredBlogs.length > 0 && !search && filterType === "all" ? filteredBlogs[0] : null;
  const gridBlogs = featuredBlog ? filteredBlogs.slice(1) : filteredBlogs;

  const modalEmbedUrl = activeModalBlog?.videoUrl ? getEmbedUrl(activeModalBlog.videoUrl) : null;
  const isModalDirectVideo =
    activeModalBlog?.videoUrl &&
    (activeModalBlog.videoUrl.startsWith("/uploads/") ||
      activeModalBlog.videoUrl.match(/\.(mp4|webm|mov)$/i));

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-primary selection:text-white flex flex-col overflow-x-hidden">
      {/* Soft ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[450px] w-[800px] rounded-full bg-[radial-gradient(ellipse,oklch(0.92_0.06_210_/_0.5),transparent_70%)] blur-[90px]" />
        <div className="absolute top-[600px] -right-32 h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,oklch(0.95_0.05_20_/_0.35),transparent_70%)] blur-[100px]" />
      </div>

      {/* Site Navbar */}
      <Navbar />

      {/* Hero Section (Responsive Clean Light Header) */}
      <section className="relative z-10 pt-28 pb-10 sm:pt-36 sm:pb-14 md:pt-40 md:pb-16 px-4 sm:px-6 border-b border-slate-200/80 bg-white/70 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl space-y-6 sm:space-y-8">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] sm:text-xs font-semibold text-cyan-800 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600" />
              </span>
              <span>PULSE HEALTH BLOGS &amp; INSIGHTS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-slate-900 leading-[1.2]">
              Health Blogs &amp;{" "}
              <span className="bg-gradient-to-r from-[oklch(0.55_0.22_20)] via-[oklch(0.6_0.19_25)] to-[oklch(0.45_0.18_265)] bg-clip-text text-transparent">
                Clinical Insights
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Educational medical articles, heart care guidance, and clinical advice published
              directly by <span className="text-slate-900 font-semibold">Dr. Prakash Chand Shahi</span>{" "}
              (Director &amp; Chief Cardiologist · Over 22+ Years of Experience).
            </p>
          </div>

          {/* Search Bar & Filter Bar - Fully Responsive */}
          <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search articles, treatments, heart care..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 sm:h-11 pl-10 pr-9 text-xs sm:text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-sm hover:border-slate-300 transition-all w-full"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:items-center">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`h-10 sm:h-11 px-2.5 sm:px-4 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                  filterType === "all"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm"
                }`}
              >
                <span>All</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    filterType === "all" ? "bg-white/20 text-white font-bold" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {blogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType("video")}
                className={`h-10 sm:h-11 px-2.5 sm:px-4 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterType === "video"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm"
                }`}
              >
                <Film className={`h-3.5 w-3.5 shrink-0 ${filterType === "video" ? "text-red-400" : "text-primary"}`} />
                <span>With Video</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterType("image")}
                className={`h-10 sm:h-11 px-2.5 sm:px-4 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterType === "image"
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm"
                }`}
              >
                <BookOpen
                  className={`h-3.5 w-3.5 shrink-0 ${filterType === "image" ? "text-emerald-300" : "text-emerald-600"}`}
                />
                <span>Articles</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl space-y-10 sm:space-y-14">
          {/* Loading state */}
          {isLoading && (
            <div className="py-24 sm:py-32 text-center space-y-3">
              <div className="inline-block h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Loading health blogs…</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredBlogs.length === 0 && (
            <div className="py-16 sm:py-24 text-center rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 max-w-md mx-auto shadow-md space-y-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">No blogs found</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {search
                  ? `No blogs match "${search}". Try another search term.`
                  : "No blogs published in this category yet."}
              </p>
              {(search || filterType !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilterType("all");
                  }}
                  className="text-xs font-semibold text-primary hover:underline pt-2 block mx-auto cursor-pointer"
                >
                  Reset filters &amp; view all
                </button>
              )}
            </div>
          )}

          {/* FEATURED SPOTLIGHT BLOG CARD */}
          {featuredBlog && (
            <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-luxe transition-all duration-500 hover:shadow-2xl">
              <div className="grid lg:grid-cols-12 gap-0 items-center">
                {/* Media Preview Player */}
                <div
                  className="lg:col-span-7 relative aspect-video w-full overflow-hidden bg-slate-900 cursor-pointer"
                  onClick={() => {
                    if (featuredBlog.videoUrl) setActiveModalBlog(featuredBlog);
                  }}
                >
                  {featuredBlog.imageUrl || getYoutubeThumbnail(featuredBlog.videoUrl) ? (
                    <img
                      src={featuredBlog.imageUrl || getYoutubeThumbnail(featuredBlog.videoUrl)!}
                      alt={featuredBlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.9] group-hover:brightness-100"
                    />
                  ) : featuredBlog.videoUrl?.startsWith("/uploads/") ? (
                    <video
                      src={featuredBlog.videoUrl}
                      muted
                      preload="metadata"
                      className="w-full h-full object-cover brightness-[0.9]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-slate-900 to-black">
                      <BookOpen className="h-16 w-16 text-white/20" />
                    </div>
                  )}

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 sm:top-5 sm:left-5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/95 backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold text-white shadow-md">
                      <Sparkles className="h-3 w-3" /> Featured Article
                    </span>
                    {featuredBlog.videoUrl && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold text-white border border-white/20">
                        <Film className="h-3 w-3 text-red-400" /> Video Included
                      </span>
                    )}
                  </div>

                  {/* Large Floating Play Button (if video) */}
                  {featuredBlog.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        type="button"
                        aria-label="Play video"
                        className="group/play flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-red-600/90 text-white shadow-2xl backdrop-blur-md transition-all duration-300 group-hover/play:scale-110 group-hover/play:bg-red-600 cursor-pointer"
                      >
                        <Play className="h-6 w-6 sm:h-8 sm:w-8 translate-x-0.5 fill-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Info Column */}
                <div className="lg:col-span-5 p-5 sm:p-8 lg:p-10 flex flex-col justify-between space-y-4 sm:space-y-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {new Date(featuredBlog.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="text-slate-700 font-semibold">Dr. Prakash Chand Shahi</span>
                    </div>

                    <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-snug">
                      <Link to="/blogs/$blogId" params={{ blogId: featuredBlog.id }}>
                        {featuredBlog.title}
                      </Link>
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {featuredBlog.content ||
                        "Click to read this comprehensive clinical guide and health discussion by our cardiology team."}
                    </p>
                  </div>

                  {/* Actions & Button */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link
                      to="/blogs/$blogId"
                      params={{ blogId: featuredBlog.id }}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-primary px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition-all shadow-md cursor-pointer"
                    >
                      <span>Read Full Article</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    {featuredBlog.videoUrl && (
                      <button
                        type="button"
                        onClick={() => setActiveModalBlog(featuredBlog)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 transition-all cursor-pointer shadow-sm"
                      >
                        <Play className="h-3.5 w-3.5 text-red-600 fill-red-600" />
                        <span>Watch Video</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GRID OF BLOGS */}
          {gridBlogs.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>All Health Articles ({gridBlogs.length})</span>
                </h3>
              </div>

              <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {gridBlogs.map((blog) => {
                  const thumb = blog.imageUrl || getYoutubeThumbnail(blog.videoUrl);
                  const hasVideo = !!blog.videoUrl;

                  return (
                    <div
                      key={blog.id}
                      className="group flex flex-col rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Media Cover */}
                      <div
                        className="relative aspect-video w-full bg-slate-900 overflow-hidden cursor-pointer"
                        onClick={() => {
                          if (hasVideo) setActiveModalBlog(blog);
                        }}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={blog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-100"
                          />
                        ) : blog.videoUrl?.startsWith("/uploads/") ? (
                          <video
                            src={blog.videoUrl}
                            muted
                            preload="metadata"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-slate-900">
                            <BookOpen className="h-10 w-10 text-white/30" />
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1.5">
                          {hasVideo && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-600/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                              <Play className="h-2.5 w-2.5 fill-white" /> Video
                            </span>
                          )}
                        </div>

                        {/* Centered Play Button */}
                        {hasVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-90 group-hover:opacity-100 transition-opacity">
                            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform">
                              <Play className="h-5 w-5 translate-x-0.5 fill-red-600" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Details */}
                      <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <Calendar className="h-3 w-3 text-primary" />
                            <span>
                              {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          <h4 className="font-display text-base sm:text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            <Link to="/blogs/$blogId" params={{ blogId: blog.id }}>
                              {blog.title}
                            </Link>
                          </h4>

                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                            {blog.content || "Read this educational piece by Dr. Prakash Chand Shahi."}
                          </p>
                        </div>

                        {/* Read link */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <Link
                            to="/blogs/$blogId"
                            params={{ blogId: blog.id }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                          >
                            <span>Read article</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                          </Link>

                          {hasVideo && (
                            <button
                              type="button"
                              onClick={() => setActiveModalBlog(blog)}
                              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="h-2.5 w-2.5 fill-current" /> Quick Play
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* QUICK VIDEO CINEMA MODAL */}
      {activeModalBlog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-fade-in"
          onClick={() => setActiveModalBlog(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-950 shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/90 text-white">
              <div className="min-w-0 flex-1 pr-4">
                <h3 className="truncate text-sm sm:text-base font-bold text-white">
                  {activeModalBlog.title}
                </h3>
                <p className="text-xs text-slate-400">Dr. Prakash Chand Shahi · Pulse Heart Centre</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalBlog(null)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              {modalEmbedUrl ? (
                <iframe
                  src={modalEmbedUrl}
                  title={activeModalBlog.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : isModalDirectVideo ? (
                <video
                  src={activeModalBlog.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <p>Video source unavailable</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-xs text-slate-400">
              <Link
                to="/blogs/$blogId"
                params={{ blogId: activeModalBlog.id }}
                onClick={() => setActiveModalBlog(null)}
                className="text-primary hover:underline font-semibold flex items-center gap-1.5"
              >
                <span>Read Full Article &amp; Case Notes</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setActiveModalBlog(null)}
                className="hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Site Footer */}
      <Footer />
    </div>
  );
}
