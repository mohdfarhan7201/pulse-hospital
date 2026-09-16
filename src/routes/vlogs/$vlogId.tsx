import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/vlogs/$vlogId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/blogs/$blogId", params: { blogId: params.vlogId } });
  },
  component: () => null,
});
