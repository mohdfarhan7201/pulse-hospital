import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/vlogs/")({
  beforeLoad: () => {
    throw redirect({ to: "/blogs" });
  },
  component: () => null,
});
