import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/blogs")({
  beforeLoad: () => {
    throw redirect({ to: "/doctor/vlogs" });
  },
  component: () => null,
});
