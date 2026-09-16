import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
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
} from "lucide-react";

import { listBlogsFn, createBlogFn, deleteBlogFn, type BlogRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/doctor/blogs")({
  component: DoctorBlogsPage,
});

function getEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const { data: blogs, isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => listBlogsFn(),
  });

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

  // Upload video via streaming XMLHttpRequest
  const uploadVideoToServer = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("video", file);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.url) {
              resolve(res.url);
            } else {
              reject(new Error(res.error || "Upload failed"));
            }
          } catch {
            reject(new Error("Invalid upload response"));
          }
        } else {
          reject(new Error(`Server error: ${xhr.statusText || xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during video upload"));
      xhr.open("POST", "/api/upload-video");
      xhr.send(formData);
    });
  };

  const createMutation = useMutation({
    mutationFn: (newPost: { title: string; content?: string; imageUrl?: string; videoUrl?: string }) =>
      createBlogFn({ data: newPost }),
    onSuccess: () => {
      toast.success("Blog published successfully!");
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
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["vlogs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to publish blog.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlogFn({ data: id }),
    onSuccess: () => {
      toast.success("Blog deleted.");
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
      if (!videoFile && !finalVideoUrl) {
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

    createMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl.trim() || undefined,
      videoUrl: finalVideoUrl || undefined,
    });
  };

  const videoPreviewEmbed = getEmbedUrl(videoUrl);

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
        {/* Left Column: Create New Blog Form */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="shadow-sm border-border/80">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> Create New Health Blog Post
              </CardTitle>
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
                      <Link2 className="h-3.5 w-3.5" /> Video Link
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
                  </div>
                )}

                {/* Tab: Video Link */}
                {activeMediaTab === "link-video" && (
                  <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                    <Label htmlFor="video-url" className="text-xs font-semibold">
                      YouTube / Vimeo Video URL
                    </Label>
                    <Input
                      id="video-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="h-9 text-xs"
                    />
                    {videoPreviewEmbed && (
                      <div className="mt-2 aspect-video w-full rounded-lg overflow-hidden border bg-black shadow-sm">
                        <iframe
                          src={videoPreviewEmbed}
                          title="Preview"
                          className="w-full h-full border-0"
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

                    {videoPreviewUrl && (
                      <div className="mt-3 aspect-video w-full rounded-xl overflow-hidden border bg-black shadow-md">
                        <video src={videoPreviewUrl} controls className="w-full h-full object-contain" />
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

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={createMutation.isPending || isUploadingVideo}
                  className="w-full gap-2 h-11 text-sm font-semibold shadow-md cursor-pointer"
                >
                  {createMutation.isPending || isUploadingVideo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Publish Blog Post</span>
                    </>
                  )}
                </Button>
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
              const isLocalVideo = item.videoUrl?.startsWith("/uploads/");
              const ytMatch = item.videoUrl?.match(
                /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
              );
              const thumbUrl = ytMatch && ytMatch[1]
                ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
                : item.imageUrl;

              return (
                <Card key={item.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                    {/* Thumbnail preview */}
                    {thumbUrl ? (
                      <div className="sm:w-36 h-28 shrink-0 relative bg-black/10 overflow-hidden">
                        <img
                          src={thumbUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        {item.videoUrl && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white fill-white" />
                          </div>
                        )}
                      </div>
                    ) : item.videoUrl ? (
                      <div className="sm:w-36 h-28 shrink-0 bg-black/80 flex items-center justify-center text-white relative">
                        <Play className="h-8 w-8 text-primary fill-primary" />
                        <span className="absolute bottom-1 right-1 text-[9px] bg-black/80 text-white px-1.5 py-0.5 rounded font-mono">
                          VIDEO
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
                            <span className="text-[10px] bg-blue-500/10 text-blue-600 font-semibold px-2 py-0.5 rounded">
                              {isLocalVideo ? "Uploaded Video" : "Video"}
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
                        <Link
                          to="/blogs/$blogId"
                          params={{ blogId: item.id }}
                          target="_blank"
                          className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                          View Live <ExternalLink className="h-3 w-3" />
                        </Link>

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
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
