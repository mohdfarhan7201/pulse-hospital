import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Video, ArrowRight } from "lucide-react";

import { listBlogsFn } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/blogs/")({
  component: BlogsPage,
  head: () => ({
    meta: [{ title: "Health Blogs & Insights · Pulse Heart Centre" }],
  }),
});

function BlogsPage() {
  const { data: blogs, isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => listBlogsFn(),
  });

  return (
    <div className="py-20 bg-muted/30 min-h-screen">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Health Insights</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Read the latest articles, heart care tips, and watch informational videos by Dr. Prakash Chand Shahi.
          </p>
        </div>

        {isLoading && (
          <div className="text-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-muted-foreground">Loading articles...</p>
          </div>
        )}

        {blogs?.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>Check back later for health articles and updates.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs?.map((blog) => (
            <Card key={blog.id} className="flex flex-col group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
              {blog.imageUrl ? (
                <div className="w-full h-56 overflow-hidden">
                  <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-primary/30" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardDescription className="text-xs font-medium uppercase tracking-wider text-primary">
                    {new Date(blog.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </CardDescription>
                  {blog.videoUrl && (
                    <span className="flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <Video className="h-3 w-3" /> Video
                    </span>
                  )}
                </div>
                <CardTitle className="line-clamp-2 text-xl">{blog.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-3 text-muted-foreground">
                  {blog.content}
                </p>
              </CardContent>
              <CardFooter className="pt-0">
                <Button variant="ghost" className="p-0 text-primary hover:bg-transparent hover:text-primary/80 group/btn" asChild>
                  <Link to={`/blogs/${blog.id}`}>
                    Read full article <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
