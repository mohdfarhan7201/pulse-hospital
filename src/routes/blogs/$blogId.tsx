import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, User, Video } from "lucide-react";

import { getBlogFn, listDoctorsFn } from "@/lib/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/blogs/$blogId")({
  component: SingleBlogPage,
});

function SingleBlogPage() {
  const { blogId } = Route.useParams();

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", blogId],
    queryFn: () => getBlogFn({ data: blogId }),
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => listDoctorsFn(),
  });

  if (isLoading) {
    return (
      <div className="py-20 min-h-screen flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent align-[-0.125em]" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="py-20 min-h-screen text-center">
        <h1 className="text-2xl font-bold mb-4">Blog not found</h1>
        <Button asChild>
          <Link to="/blogs">Back to Blogs</Link>
        </Button>
      </div>
    );
  }

  const author = doctors?.find((d) => d.id === blog.authorId)?.name || "Dr. Prakash Chand Shahi";

  // Attempt to extract YouTube video ID if the link is a youtube link
  let embedVideoUrl = blog.videoUrl;
  if (blog.videoUrl) {
    const ytMatch = blog.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) {
      embedVideoUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
  }

  return (
    <article className="pb-20 pt-10 min-h-screen bg-background">
      <div className="container max-w-4xl px-4">
        <Button variant="ghost" className="mb-8 -ml-4 text-muted-foreground" asChild>
          <Link to="/blogs">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to all articles
          </Link>
        </Button>

        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {author}
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-6">
            {blog.title}
          </h1>
        </header>

        {blog.imageUrl && (
          <div className="w-full h-64 md:h-[400px] overflow-hidden rounded-2xl mb-12 shadow-lg">
            <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
          {blog.content.split('\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>

        {embedVideoUrl && (
          <div className="mt-12 bg-muted/30 p-6 rounded-2xl">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Video className="h-5 w-5 text-primary" /> Watch Video
            </h3>
            <div className="aspect-video w-full overflow-hidden rounded-xl shadow-md">
              <iframe
                src={embedVideoUrl}
                title="Video player"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
