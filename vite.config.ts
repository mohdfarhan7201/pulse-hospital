// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
    rollupConfig: {
      output: {
        inlineDynamicImports: true,
      },
    },
    externals: {
      traceInclude: ["node_modules/mongoose/**", "node_modules/mongodb/**", "node_modules/bson/**"],
      external: ["mongoose", "mongodb", "bson"],
    },
  },
  vite: {
    ssr: {
      external: ["mongoose", "mongodb", "bson"],
      noExternal: [
        /^@radix-ui\//,
        /^@floating-ui\//,
        "framer-motion",
        "lucide-react",
        "recharts",
        "clsx",
        "tailwind-merge",
        "prop-types",
        "date-fns",
        "react-day-picker",
      ],
    },
  },
});
