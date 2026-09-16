import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  Video,
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

import { listVlogsFn, type VlogRecord } from "@/lib/api";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/vlogs/")({
  component: VlogsPage,
  head: () => ({
    meta: [
      { title: "Clinical Vlogs & Heart Health Videos · Pulse Heart Centre" },
      {
        name: "description",
        content:
          "Watch exclusive clinical vlogs, surgical case studies, and cardiac health guidance recorded by Dr. Prakash Chand Shahi at Pulse Heart Centre, Gorakhpur.",
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

function VlogsPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "video" | "image">("all");
  const [activeModalVlog, setActiveModalVlog] = useState<VlogRecord | null>(null);

  const { data: vlogs = [], isLoading } = useQuery({
    queryKey: ["vlogs"],
    queryFn: () => listVlogsFn(),
    staleTime: 60_000,
  });

  const filteredVlogs = useMemo(() => {
    return vlogs.filter((vlog: VlogRecord) => {
      const q = search.toLowerCase().trim();
      const matchesQuery =
        !q ||
        vlog.title.toLowerCase().includes(q) ||
        (vlog.content && vlog.content.toLowerCase().includes(q));

      if (!matchesQuery) return false;

      if (filterType === "video") return !!vlog.videoUrl;
      if (filterType === "image") return !!vlog.imageUrl && !vlog.videoUrl;
      return true;
    });
  }, [vlogs, search, filterType]);

  const featuredVlog =
    filteredVlogs.length > 0 && !search && filterType === "all" ? filteredVlogs[0] : null;
  const gridVlogs = featuredVlog ? filteredVlogs.slice(1) : filteredVlogs;

  const modalEmbedUrl = activeModalVlog?.videoUrl ? getEmbedUrl(activeModalVlog.videoUrl) : null;
  const isModalDirectVideo =
    activeModalVlog?.videoUrl &&
    (activeModalVlog.videoUrl.startsWith("/uploads/") ||
      activeModalVlog.videoUrl.match(/\.(mp4|webm|mov)$/i));

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
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] sm:text-xs font-semibold text-red-700 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-crimson" />
              </span>
              <span>PULSE CLINICAL MEDIA &amp; VLOGS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-slate-900 leading-[1.2]">
              Cardiovascular Vlogs &amp;{" "}
              <span className="bg-gradient-to-r from-[oklch(0.55_0.22_20)] via-[oklch(0.6_0.19_25)] to-[oklch(0.45_0.18_265)] bg-clip-text text-transparent">
                Recorded Case Studies
              </span>
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Educational cardiology videos, surgery explanations, and recovery guidance recorded
              directly by <span className="text-slate-900 font-semibold">Dr. Prakash Chand Shahi</span>{" "}
              (MBBS, MD, DM Cardiology · Over 22+ Years of Clinical Experience).
            </p>
          </div>

          {/* Search Bar & Filter Bar - Fully Responsive */}
          <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
            {/* Search Input */}
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search vlogs, treatments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 sm:h-11 pl-10 pr-9 text-xs sm:text-sm bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl shadow-sm hover:border-slate-300 transition-all w-full"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills - Perfect 3-column Grid on Mobile, Flex on Desktop */}
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
                  {vlogs.length}
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
                <span>Videos</span>
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
                <ImageIcon
                  className={`h-3.5 w-3.5 shrink-0 ${filterType === "image" ? "text-emerald-300" : "text-emerald-600"}`}
                />
                <span>Photos</span>
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
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Loading clinical vlogs…</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredVlogs.length === 0 && (
            <div className="py-16 sm:py-24 text-center rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 max-w-md mx-auto shadow-md space-y-4">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Film className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">No vlogs found</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {search
                  ? `No vlogs match "${search}". Try another search term.`
                  : "No recorded vlogs published in this category yet."}
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

          {/* FEATURED SPOTLIGHT VLOG (Responsive Cinema Card) */}
          {featuredVlog && (
            <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-luxe transition-all duration-500 hover:shadow-2xl">
              <div className="grid lg:grid-cols-12 gap-0 items-center">
                {/* Media Preview Player with Play Trigger */}
                <div
                  className="lg:col-span-7 relative aspect-video w-full overflow-hidden bg-slate-900 cursor-pointer"
                  onClick={() => {
                    if (featuredVlog.videoUrl) setActiveModalVlog(featuredVlog);
                  }}
                >
                  {/* Thumbnail / Video Preview */}
                  {featuredVlog.imageUrl || getYoutubeThumbnail(featuredVlog.videoUrl) ? (
                    <img
                      src={featuredVlog.imageUrl || getYoutubeThumbnail(featuredVlog.videoUrl)!}
                      alt={featuredVlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.9] group-hover:brightness-100"
                    />
                  ) : featuredVlog.videoUrl?.startsWith("/uploads/") ? (
                    <video
                      src={featuredVlog.videoUrl}
                      muted
                      preload="metadata"
                      className="w-full h-full object-cover brightness-[0.9]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-slate-900 to-black">
                      <Film className="h-16 w-16 text-white/20" />
                    </div>
                  )}

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 sm:top-5 sm:left-5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/95 backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-bold text-white shadow-md">
                      <Sparkles className="h-3 w-3" /> Featured Vlog
                    </span>
                    {featuredVlog.videoUrl && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 backdrop-blur-md px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-semibold text-white border border-white/20">
                        <Video className="h-3 w-3 text-blue-400" /> Watch
                      </span>
                    )}
                  </div>

                  {/* Center Play Button */}
                  {featuredVlog.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative flex items-center justify-center">
                        <span className="animate-ping absolute h-14 w-14 sm:h-20 sm:w-20 rounded-full bg-white/25" />
                        <div className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                          <Play className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8 fill-slate-900 ml-0.5 sm:ml-1" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-5 sm:right-5 text-[11px] sm:text-xs text-white/70 flex items-center justify-between pointer-events-none">
                    <span>Click to play video</span>
                    <span className="font-mono text-white/90">Dr. P. C. Shahi</span>
                  </div>
                </div>

                {/* Text Content Column */}
                <div className="lg:col-span-5 p-5 sm:p-7 lg:p-10 flex flex-col justify-between space-y-4 sm:space-y-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {new Date(featuredVlog.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-2xl lg:text-3xl font-display font-bold text-slate-900 leading-snug group-hover:text-primary transition-colors">
                      {featuredVlog.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 font-normal">
                      {featuredVlog.content ||
                        "Watch this cardiology treatment video to understand the medical procedure and recovery protocols."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 sm:pt-6 border-t border-slate-100 flex items-center justify-between gap-3">
                    {featuredVlog.videoUrl ? (
                      <button
                        type="button"
                        onClick={() => setActiveModalVlog(featuredVlog)}
                        className="btn-lux inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-slate-900 px-4 py-2 sm:px-5 sm:py-2.5 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" /> Watch Video
                      </button>
                    ) : null}

                    <Link
                      to="/vlogs/$vlogId"
                      params={{ vlogId: featuredVlog.id }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-primary transition-colors ml-auto"
                    >
                      <span>Full Details</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REGULAR GRID OF VLOGS */}
          {gridVlogs.length > 0 && (
            <div className="space-y-5 sm:space-y-6">
              {featuredVlog && (
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-lg sm:text-2xl font-display font-bold text-slate-900">
                      All Recorded Vlogs &amp; Posts
                    </h3>
                    <p className="text-xs text-slate-500">
                      Explore clinical cardiac case studies &amp; guidance
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {gridVlogs.length} {gridVlogs.length === 1 ? "vlog" : "vlogs"}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {gridVlogs.map((post: VlogRecord) => {
                  const thumb = post.imageUrl || getYoutubeThumbnail(post.videoUrl);

                  return (
                    <article
                      key={post.id}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Media container */}
                      <div
                        onClick={() => {
                          if (post.videoUrl) setActiveModalVlog(post);
                        }}
                        className="relative aspect-video w-full overflow-hidden bg-slate-900 cursor-pointer block"
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={post.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-100"
                          />
                        ) : post.videoUrl?.startsWith("/uploads/") ? (
                          <video
                            src={post.videoUrl}
                            muted
                            preload="metadata"
                            className="h-full w-full object-cover brightness-95"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-slate-900">
                            <Film className="h-10 w-10 text-white/30" />
                          </div>
                        )}

                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                        {/* Top tag badge */}
                        <div className="absolute top-2.5 left-2.5 flex gap-2">
                          {post.videoUrl ? (
                            <Badge className="bg-black/75 backdrop-blur-md text-white text-[10px] font-semibold tracking-wide border border-white/20 px-2 py-0.5">
                              <Video className="h-3 w-3 mr-1 text-blue-400" /> Video
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-950/80 backdrop-blur-md text-emerald-300 text-[10px] font-semibold tracking-wide border border-emerald-500/30 px-2 py-0.5">
                              <ImageIcon className="h-3 w-3 mr-1" /> Photo
                            </Badge>
                          )}
                        </div>

                        {/* Play overlay button for video */}
                        {post.videoUrl && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-11 w-11 rounded-full bg-white/95 text-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                              <Play className="h-4 w-4 fill-slate-900 ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5 space-y-3 sm:space-y-4">
                        <div className="space-y-2">
                          {/* Metadata row */}
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1 text-[11px]">
                              <Calendar className="h-3 w-3 text-primary" />
                              {new Date(post.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-[11px] font-medium text-slate-600">
                              Dr. P. C. Shahi
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="font-display text-base font-bold leading-snug text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                            <Link to="/vlogs/$vlogId" params={{ vlogId: post.id }}>
                              {post.title}
                            </Link>
                          </h4>

                          {/* Description snippet */}
                          {post.content && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                              {post.content}
                            </p>
                          )}
                        </div>

                        {/* Bottom Action bar */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          {post.videoUrl ? (
                            <button
                              type="button"
                              onClick={() => setActiveModalVlog(post)}
                              className="font-bold text-slate-900 hover:text-primary transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Play className="h-3 w-3 fill-primary text-primary" /> Watch Now
                            </button>
                          ) : (
                            <Link
                              to="/vlogs/$vlogId"
                              params={{ vlogId: post.id }}
                              className="font-bold text-slate-900 hover:text-primary transition-colors inline-flex items-center gap-1.5"
                            >
                              View Post
                            </Link>
                          )}

                          <Link
                            to="/vlogs/$vlogId"
                            params={{ vlogId: post.id }}
                            className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 transition-colors font-medium text-[11px]"
                          >
                            <span>Details</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* CINEMA VIDEO MODAL - Fully Responsive */}
      {activeModalVlog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setActiveModalVlog(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Close */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b border-white/15 bg-white/5">
              <div className="flex items-center gap-2 pr-4 min-w-0">
                <Video className="h-4 w-4 text-primary shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  {activeModalVlog.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalVlog(null)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="aspect-video w-full bg-black relative">
              {modalEmbedUrl ? (
                <iframe
                  src={modalEmbedUrl}
                  title={activeModalVlog.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isModalDirectVideo ? (
                <video
                  src={activeModalVlog.videoUrl}
                  poster={activeModalVlog.imageUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video.
                </video>
              ) : (
                <div className="flex items-center justify-center h-full text-white/50">
                  <p>Video not playable</p>
                </div>
              )}
            </div>

            {/* Footer with Details Link */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 bg-slate-900 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-primary font-bold">
                  Pulse Heart Centre · Dr. Prakash Chand Shahi
                </span>
                <p className="text-xs text-white/70 line-clamp-1">
                  {activeModalVlog.content || activeModalVlog.title}
                </p>
              </div>

              <Link
                to="/vlogs/$vlogId"
                params={{ vlogId: activeModalVlog.id }}
                onClick={() => setActiveModalVlog(null)}
                className="btn-lux inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Full Details &amp; Transcript</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Site Footer */}
      <Footer />
    </div>
  );
}
