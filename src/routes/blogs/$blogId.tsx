import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/blogs/$blogId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/vlogs/$vlogId", params: { vlogId: params.blogId } });
  },
  component: () => null,
});
