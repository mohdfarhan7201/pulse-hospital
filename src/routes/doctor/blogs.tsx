import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  ExternalLink,
  Upload,
  X,
  Play,
  FileText,
  Send,
  Loader2,
  Plus,
  BookOpen,
  Link2,
  CheckCircle2,
  Pencil,
  Check,
  Instagram,
  Youtube,
} from "lucide-react";

import { listBlogsFn, createBlogFn, updateBlogFn, deleteBlogFn, type BlogRecord } from "@/lib/api";
import { parseVideoUrl } from "@/lib/video";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type DoctorBlogsSearch = {
  edit?: string;
};

export const Route = createFileRoute("/doctor/blogs")({
  validateSearch: (search: Record<string, unknown>): DoctorBlogsSearch => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  component: DoctorBlogsPage,
});

const captureThumbnailFromVideo = (videoFile: File): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(videoFile);
    video.currentTime = 1;

    video.onloadeddata = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataUrl);
      } catch {
        resolve("");
      } finally {
        URL.revokeObjectURL(video.src);
      }
    };

    video.onerror = () => {
      resolve("");
    };
  });
};

function DoctorBlogsPage() {
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const formRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const { data: blogs, isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => listBlogsFn(),
  });

  // Edit Mode state
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [activeMediaTab, setActiveMediaTab] = useState<"upload-video" | "link-video" | "image" | "none">("image");
  const [isCompressing, setIsCompressing] = useState(false);

  // Uploaded Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Handler for direct video file selection
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file (MP4, WebM, MOV).");
      return;
    }

    setVideoFile(file);
    const localUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(localUrl);
    setVideoUrl(""); // clear link if any

    // Automatically generate thumbnail from frame 1
    try {
      const thumb = await captureThumbnailFromVideo(file);
      if (thumb && !imageUrl) {
        setImageUrl(thumb);
      }
    } catch {
      // ignore
    }
  };

  // Handler for custom cover image
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.78);
        setImageUrl(compressedBase64);
        setIsCompressing(false);
      };
      img.onerror = () => {
        toast.error("Failed to process image file.");
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Upload video via chunked upload (prevents 413 Payload Too Large on Vercel)
  const uploadVideoToServer = async (file: File): Promise<string> => {
    // 1.5 MB chunk size to ensure each chunk stays well below Vercel's 4.5 MB limit
    const CHUNK_SIZE = 1.5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    setUploadProgress(0);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBlob = file.slice(start, end);

      const formData = new FormData();
      formData.append("uploadId", uploadId);
      formData.append("chunkIndex", String(chunkIndex));
      formData.append("totalChunks", String(totalChunks));
      formData.append("fileName", file.name);
      formData.append("chunk", chunkBlob, file.name);

      const res = await new Promise<{ done?: boolean; url?: string; error?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const chunkFraction = event.loaded / event.total;
            const currentPercent = Math.round(((chunkIndex + chunkFraction) / totalChunks) * 100);
            setUploadProgress(Math.min(currentPercent, 99));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const parsed = JSON.parse(xhr.responseText);
              resolve(parsed);
            } catch {
              reject(new Error("Invalid chunk upload response"));
            }
          } else {
            let errorMsg = `Server error (${xhr.status}): ${xhr.statusText || "Chunk upload failed"}`;
            try {
              const errBody = JSON.parse(xhr.responseText);
              if (errBody?.error) errorMsg = errBody.error;
            } catch {}
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during chunk upload"));
        xhr.open("POST", "/api/upload-video-chunk");
        xhr.send(formData);
      });

      if (res.error) {
        throw new Error(res.error);
      }

      if (res.done && res.url) {
        setUploadProgress(100);
        return res.url;
      }
    }

    throw new Error("Upload did not complete successfully");
  };

  const resetForm = () => {
    setEditingBlogId(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setVideoUrl("");
    setVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (videoFileInputRef.current) videoFileInputRef.current.value = "";
  };

  const startEdit = (item: BlogRecord) => {
    setEditingBlogId(item.id);
    setTitle(item.title);
    setContent(item.content || "");
    setImageUrl(item.imageUrl || "");
    setVideoUrl(item.videoUrl || "");
    setVideoFile(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);

    if (item.videoUrl) {
      if (
        item.videoUrl.startsWith("/uploads/") ||
        item.videoUrl.startsWith("/api/video/") ||
        item.videoUrl.match(/\.(mp4|webm|mov)$/i)
      ) {
        setActiveMediaTab("upload-video");
      } else {
        setActiveMediaTab("link-video");
      }
    } else {
      setActiveMediaTab("image");
    }

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (search.edit && blogs && blogs.length > 0) {
      const found = blogs.find((b) => b.id === search.edit);
      if (found) {
        startEdit(found);
      }
    }
  }, [search.edit, blogs]);

  const createMutation = useMutation({
    mutationFn: (newPost: { title: string; content?: string; imageUrl?: string; videoUrl?: string }) =>
      createBlogFn({ data: newPost }),
    onSuccess: () => {
      toast.success("Blog published successfully!");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["vlogs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to publish blog.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedPost: { id: string; title: string; content?: string; imageUrl?: string; videoUrl?: string }) =>
      updateBlogFn({ data: updatedPost }),
    onSuccess: () => {
      toast.success("Blog updated successfully!");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["vlogs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update blog.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlogFn({ data: id }),
    onSuccess: (_data, deletedId) => {
      toast.success("Blog deleted.");
      if (editingBlogId === deletedId) {
        resetForm();
      }
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["vlogs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete blog.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title for the blog post.");
      return;
    }

    let finalVideoUrl = videoUrl.trim();

    // If uploading a local video file
    if (activeMediaTab === "upload-video") {
      if (!videoFile && !finalVideoUrl && !editingBlogId) {
        toast.error("Please select a video file to upload.");
        return;
      }

      if (videoFile) {
        setIsUploadingVideo(true);
        try {
          finalVideoUrl = await uploadVideoToServer(videoFile);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Video upload failed";
          toast.error(message);
          setIsUploadingVideo(false);
          return;
        }
        setIsUploadingVideo(false);
      }
    }

    if (editingBlogId) {
      updateMutation.mutate({
        id: editingBlogId,
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        videoUrl: finalVideoUrl || undefined,
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined,
        videoUrl: finalVideoUrl || undefined,
      });
    }
  };

  const videoInfo = parseVideoUrl(videoUrl);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Health Blogs &amp; Articles Studio
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publish medical articles, patient education guides, and clinical advice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to="/blogs" target="_blank">
              <ExternalLink className="h-4 w-4" /> View Public Blogs
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Create / Edit Blog Form */}
        <div ref={formRef} className="lg:col-span-6 space-y-6">
          <Card
            className={`shadow-sm transition-all duration-300 ${
              editingBlogId ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border/80"
            }`}
          >
            <CardHeader
              className={`border-b pb-4 transition-colors ${
                editingBlogId ? "bg-primary/5" : "bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  {editingBlogId ? (
                    <>
                      <Pencil className="h-4 w-4 text-primary" /> Edit Health Blog Post
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 text-primary" /> Create New Health Blog Post
                    </>
                  )}
                </CardTitle>
                {editingBlogId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel Edit
                  </Button>
                )}
              </div>
              {editingBlogId && (
                <p className="text-xs text-primary font-medium mt-1">
                  ✏️ Currently editing this article. Make your changes and click &quot;Update Blog Post&quot; below.
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Article Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. 5 Common Signs of Heart Disease You Shouldn't Ignore"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 text-sm"
                    required
                  />
                </div>

                {/* Media Selector Tabs */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Cover Media Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("image")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        activeMediaTab === "image"
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Cover Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("link-video")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        activeMediaTab === "link-video"
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Link2 className="h-3.5 w-3.5" /> Video Link (YT / Insta)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveMediaTab("upload-video")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                        activeMediaTab === "upload-video"
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload Video
                    </button>
                  </div>
                </div>

                {/* Tab: Cover Image */}
                {activeMediaTab === "image" && (
                  <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                    <Label className="text-xs font-semibold">Cover Image</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://images.unsplash.com/... or paste image URL"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="text-xs h-9"
                      />
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageFile}
                        className="hidden"
                        id="blog-image-input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCompressing}
                        className="h-9 shrink-0 gap-1.5 text-xs cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" /> Upload
                      </Button>
                    </div>

                    {imageUrl && (
                      <div className="relative mt-2 rounded-lg overflow-hidden border bg-muted/30 flex items-center justify-center h-48">
                        <img
                          src={imageUrl}
                          alt="Cover background"
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none"
                        />
                        <img
                          src={imageUrl}
                          alt="Cover Preview"
                          className="relative z-10 max-h-full max-w-full object-contain drop-shadow"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setImageUrl("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute top-2 right-2 z-20 h-7 text-xs px-2 shadow-md cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Video Link (YouTube / Instagram / Vimeo) */}
                {activeMediaTab === "link-video" && (
                  <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <Label htmlFor="video-url" className="text-xs font-semibold">
                        YouTube / Instagram / Vimeo Video URL
                      </Label>
                      {videoInfo.platform === "youtube" && (
                        <span className="text-[10px] bg-red-500/10 text-red-600 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-red-200/50">
                          <Youtube className="h-3 w-3" /> YouTube Video Detected
                        </span>
                      )}
                      {videoInfo.platform === "instagram" && (
                        <span className="text-[10px] bg-gradient-to-r from-purple-500/15 to-pink-500/15 text-pink-600 font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-pink-200/60">
                          <Instagram className="h-3 w-3" /> Instagram Reel/Post Detected
                        </span>
                      )}
                    </div>

                    <Input
                      id="video-url"
                      placeholder="https://www.youtube.com/watch?v=... or https://www.instagram.com/reel/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="h-9 text-xs"
                    />

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      💡 <strong>Supported:</strong> YouTube videos, YouTube Shorts, Instagram Reels, Instagram video posts, and Vimeo links.
                    </p>

                    {videoInfo.externalUrl && (
                      <div className="flex items-center justify-between text-xs bg-muted/60 p-2.5 rounded-lg border">
                        <span className="text-muted-foreground truncate max-w-[240px] font-mono text-[11px]">
                          {videoInfo.externalUrl}
                        </span>
                        <a
                          href={videoInfo.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs"
                        >
                          Test on {videoInfo.label || "Web"} <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    {videoInfo.embedUrl && (
                      <div
                        className={`mt-2 w-full rounded-lg overflow-hidden border bg-black shadow-sm ${
                          videoInfo.platform === "instagram"
                            ? "max-w-xs mx-auto aspect-[9/16] max-h-[460px]"
                            : "aspect-video"
                        }`}
                      >
                        <iframe
                          src={videoInfo.embedUrl}
                          title="Preview"
                          className="w-full h-full border-0"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Direct Video Upload */}
                {activeMediaTab === "upload-video" && (
                  <div className="space-y-3 p-4 rounded-xl border bg-muted/20 border-dashed">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span>Select Video File</span>
                      {videoFile && (
                        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Ready ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      )}
                    </Label>

                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="hidden"
                      id="video-file-input"
                    />

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant={videoFile ? "outline" : "default"}
                        size="sm"
                        onClick={() => videoFileInputRef.current?.click()}
                        disabled={isUploadingVideo}
                        className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {videoFile ? "Choose Different Video" : "Select Video File"}
                      </Button>

                      {videoFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setVideoFile(null);
                            if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
                            setVideoPreviewUrl(null);
                            if (videoFileInputRef.current) videoFileInputRef.current.value = "";
                          }}
                          className="h-9 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                      💡 <strong>Tip:</strong> Automatic chunked cloud streaming is active. Your video will upload safely in chunks without size limits or 413 errors.
                    </p>

                    {!videoFile && videoUrl && (videoUrl.startsWith("/uploads/") || videoUrl.startsWith("/api/video/")) && (
                      <div className="flex items-center justify-between text-xs bg-muted/60 p-2.5 rounded-lg border">
                        <span className="truncate max-w-[220px] text-muted-foreground font-medium">
                          📹 Attached video: {videoUrl.split("/").pop()}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setVideoUrl("")}
                          className="h-6 text-xs text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
                        >
                          <X className="h-3 w-3 mr-1" /> Remove Video
                        </Button>
                      </div>
                    )}

                    {(videoPreviewUrl || (!videoFile && videoUrl && (videoUrl.startsWith("/uploads/") || videoUrl.startsWith("/api/video/")))) && (
                      <div className="mt-3 aspect-video w-full rounded-xl overflow-hidden border bg-black shadow-md">
                        <video src={videoPreviewUrl || videoUrl} controls className="w-full h-full object-contain" />
                      </div>
                    )}

                    {isUploadingVideo && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Uploading video...</span>
                          <span className="font-semibold">{uploadProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Article Content */}
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-xs font-semibold">
                    Article Text &amp; Medical Notes
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Write the article content, clinical background, recommendations..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="text-sm resize-y leading-relaxed font-normal"
                  />
                </div>

                {/* Submit / Update Button */}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || isUploadingVideo}
                    className="flex-1 gap-2 h-11 text-sm font-semibold shadow-md cursor-pointer"
                  >
                    {createMutation.isPending || updateMutation.isPending || isUploadingVideo ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{editingBlogId ? "Updating Blog..." : "Publishing..."}</span>
                      </>
                    ) : editingBlogId ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Update Blog Post</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Publish Blog Post</span>
                      </>
                    )}
                  </Button>
                  {editingBlogId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="h-11 px-4 text-sm cursor-pointer"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Published Blogs List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Published Articles ({blogs?.length ?? 0})
            </h2>
          </div>

          {isLoading && (
            <div className="py-20 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-xs">Loading articles...</p>
            </div>
          )}

          {!isLoading && (!blogs || blogs.length === 0) && (
            <div className="py-16 text-center border rounded-2xl bg-muted/20 p-6 space-y-3">
              <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <h3 className="font-semibold text-sm">No articles published yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Use the form on the left to publish your first health article.
              </p>
            </div>
          )}

          <div className="space-y-3 overflow-y-auto max-h-[850px] pr-1">
            {blogs?.map((item: BlogRecord) => {
              const itemVideo = parseVideoUrl(item.videoUrl);
              const isLocalVideo = itemVideo.platform === "local";
              const thumbUrl = item.imageUrl || itemVideo.thumbnailUrl;

              return (
                <Card
                  key={item.id}
                  className={`overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${
                    editingBlogId === item.id
                      ? "ring-2 ring-primary border-primary bg-primary/[0.02]"
                      : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                    {/* Thumbnail preview */}
                    {thumbUrl ? (
                      <div className="sm:w-36 h-28 shrink-0 relative bg-muted/40 overflow-hidden flex items-center justify-center">
                        <img
                          src={thumbUrl}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none"
                        />
                        <img
                          src={thumbUrl}
                          alt={item.title}
                          className="relative z-10 w-full h-full object-contain drop-shadow-sm"
                        />
                        {item.videoUrl && (
                          <div className="absolute inset-0 z-20 bg-black/30 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                        )}
                      </div>
                    ) : item.videoUrl ? (
                      <div className={`sm:w-36 h-28 shrink-0 flex items-center justify-center text-white relative ${
                        itemVideo.platform === "instagram"
                          ? "bg-gradient-to-tr from-purple-700 via-pink-600 to-amber-500"
                          : "bg-black/80"
                      }`}>
                        {itemVideo.platform === "instagram" ? (
                          <Instagram className="h-8 w-8 text-white" />
                        ) : itemVideo.platform === "youtube" ? (
                          <Youtube className="h-8 w-8 text-red-500" />
                        ) : (
                          <Play className="h-8 w-8 text-primary fill-primary" />
                        )}
                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/80 text-white px-1.5 py-0.5 rounded font-mono">
                          {itemVideo.label.toUpperCase() || "VIDEO"}
                        </span>
                      </div>
                    ) : (
                      <div className="sm:w-36 h-28 shrink-0 bg-muted flex items-center justify-center text-muted-foreground">
                        <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}

                    {/* Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {item.videoUrl && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                                itemVideo.platform === "youtube"
                                  ? "bg-red-500/10 text-red-600"
                                  : itemVideo.platform === "instagram"
                                  ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-pink-600 border border-pink-200/50"
                                  : "bg-blue-500/10 text-blue-600"
                              }`}
                            >
                              {itemVideo.platform === "youtube" && <Youtube className="h-3 w-3" />}
                              {itemVideo.platform === "instagram" && <Instagram className="h-3 w-3" />}
                              {itemVideo.platform === "youtube"
                                ? "YouTube"
                                : itemVideo.platform === "instagram"
                                ? "Instagram"
                                : isLocalVideo
                                ? "Uploaded Video"
                                : "Video"}
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-sm text-foreground mt-1 line-clamp-2">
                          {item.title}
                        </h3>

                        {item.content && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-normal">
                            {item.content}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 mt-2 border-t text-xs">
                        <div className="flex items-center gap-2">
                          <Link
                            to="/blogs/$blogId"
                            params={{ blogId: item.id }}
                            target="_blank"
                            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                          >
                            View Live <ExternalLink className="h-3 w-3" />
                          </Link>

                          {itemVideo.externalUrl && (itemVideo.platform === "youtube" || itemVideo.platform === "instagram") && (
                            <a
                              href={itemVideo.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`font-semibold inline-flex items-center gap-1 hover:underline text-xs ${
                                itemVideo.platform === "youtube" ? "text-red-600" : "text-pink-600"
                              }`}
                            >
                              {itemVideo.platform === "youtube" && <Youtube className="h-3 w-3" />}
                              {itemVideo.platform === "instagram" && <Instagram className="h-3 w-3" />}
                              Open <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(item)}
                            className={`h-7 text-xs px-2.5 cursor-pointer gap-1.5 ${
                              editingBlogId === item.id
                                ? "border-primary text-primary bg-primary/10 font-semibold"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <Pencil className="h-3 w-3 text-primary" /> Edit
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this blog?")) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="h-7 text-xs text-destructive hover:bg-destructive/10 px-2 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
