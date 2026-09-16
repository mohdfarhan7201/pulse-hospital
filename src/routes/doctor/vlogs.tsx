import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/vlogs")({
  beforeLoad: () => {
    throw redirect({ to: "/doctor/blogs" });
  },
  component: () => null,
});
