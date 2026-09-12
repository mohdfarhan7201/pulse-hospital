import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Edit, Plus, Trash2, Link as LinkIcon, Image as ImageIcon, Video as VideoIcon } from "lucide-react";

import { listBlogsFn, createBlogFn, updateBlogFn, deleteBlogFn, type BlogRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/doctor/blogs")({
  component: DoctorBlogsPage,
});

function DoctorBlogsPage() {
  const queryClient = useQueryClient();
  const { data: blogs, isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => listBlogsFn(),
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setImageUrl("");
    setVideoUrl("");
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (blog: BlogRecord) => {
    setEditingId(blog.id);
    setTitle(blog.title);
    setContent(blog.content);
    setImageUrl(blog.imageUrl || "");
    setVideoUrl(blog.videoUrl || "");
    setIsDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (vars: Parameters<typeof createBlogFn>[0]["data"]) => createBlogFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog published successfully!");
      setIsDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to publish blog"),
  });

  const updateMutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateBlogFn>[0]["data"]) => updateBlogFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog updated successfully!");
      setIsDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update blog"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlogFn({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      toast.success("Blog deleted.");
    },
  });

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      return toast.error("Title and content are required.");
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title,
        content,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
      });
    } else {
      createMutation.mutate({
        title,
        content,
        imageUrl: imageUrl || undefined,
        videoUrl: videoUrl || undefined,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this blog post?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Blog Management</h2>
          <p className="text-sm text-muted-foreground">
            Publish articles, health tips, and videos for your patients.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Post Title</Label>
              <Input
                id="title"
                placeholder="e.g. 5 Tips for a Healthy Heart"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Write your article here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image" className="flex items-center gap-2"><ImageIcon className="h-4 w-4"/> Image URL</Label>
                <Input
                  id="image"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video" className="flex items-center gap-2"><VideoIcon className="h-4 w-4"/> Video URL (Optional)</Label>
                <Input
                  id="video"
                  placeholder="https://youtube.com/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Save Changes" : "Publish Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && <p className="text-muted-foreground">Loading blogs...</p>}
        {blogs?.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p>No blogs published yet.</p>
          </div>
        )}
        {blogs?.map((blog) => (
          <Card key={blog.id} className="flex flex-col">
            {blog.imageUrl && (
              <div className="w-full h-48 overflow-hidden rounded-t-xl">
                <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="line-clamp-2">{blog.title}</CardTitle>
              <CardDescription>{new Date(blog.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="line-clamp-3 text-sm text-muted-foreground">{blog.content}</p>
              {blog.videoUrl && (
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-500 bg-blue-500/10 w-fit px-2 py-1 rounded">
                  <VideoIcon className="h-3 w-3" /> Includes Video
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between border-t pt-4">
              <Button variant="ghost" size="sm" onClick={() => openEditDialog(blog)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/90" onClick={() => handleDelete(blog.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
