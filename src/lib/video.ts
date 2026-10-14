export type VideoPlatform = "youtube" | "instagram" | "vimeo" | "local" | "unknown";

export interface VideoInfo {
  platform: VideoPlatform;
  id: string | null;
  embedUrl: string | null;
  externalUrl: string | null;
  thumbnailUrl: string | null;
  label: string;
}

/**
 * Parses any video URL (YouTube, Instagram Reel/Post, Vimeo, or local uploaded file)
 * and returns standard embed URLs, external direct links, and thumbnails.
 */
export function parseVideoUrl(url?: string | null): VideoInfo {
  if (!url || typeof url !== "string") {
    return {
      platform: "unknown",
      id: null,
      embedUrl: null,
      externalUrl: null,
      thumbnailUrl: null,
      label: "",
    };
  }

  const trimmed = url.trim();

  // 1. YouTube (Standard, Shorts, youtu.be, embed)
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    return {
      platform: "youtube",
      id,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`,
      externalUrl: `https://www.youtube.com/watch?v=${id}`,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      label: "YouTube",
    };
  }

  // 2. Instagram (Reels, Posts, IGTV)
  const igMatch = trimmed.match(
    /(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i
  );
  if (igMatch && igMatch[1]) {
    const id = igMatch[1];
    const cleanUrl = trimmed.startsWith("http")
      ? trimmed.split("?")[0].replace(/\/+$/, "") + "/"
      : `https://www.instagram.com/reel/${id}/`;
    return {
      platform: "instagram",
      id,
      embedUrl: `https://www.instagram.com/p/${id}/embed/`,
      externalUrl: cleanUrl,
      thumbnailUrl: null,
      label: "Instagram",
    };
  }

  // 3. Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const id = vimeoMatch[1];
    return {
      platform: "vimeo",
      id,
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`,
      externalUrl: `https://vimeo.com/${id}`,
      thumbnailUrl: null,
      label: "Vimeo",
    };
  }

  // 4. Local or direct uploaded video file
  if (
    trimmed.startsWith("/uploads/") ||
    trimmed.startsWith("/api/video/") ||
    trimmed.match(/\.(mp4|webm|mov)$/i)
  ) {
    return {
      platform: "local",
      id: null,
      embedUrl: null,
      externalUrl: trimmed,
      thumbnailUrl: null,
      label: "Uploaded Video",
    };
  }

  // Fallback for other web URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      platform: "unknown",
      id: null,
      embedUrl: null,
      externalUrl: trimmed,
      thumbnailUrl: null,
      label: "External Video",
    };
  }

  return {
    platform: "unknown",
    id: null,
    embedUrl: null,
    externalUrl: null,
    thumbnailUrl: null,
    label: "",
  };
}
