import "./lib/error-capture";

import fs from "fs/promises";
import path from "path";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(new Error(`h3 swallowed SSR error: ${body}`)), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // 1. Direct Video File Upload API (/api/upload-video)
      if (url.pathname === "/api/upload-video" && request.method === "POST") {
        try {
          const formData = await request.formData();
          const file = formData.get("video") as File | null;
          if (!file) {
            return new Response(JSON.stringify({ error: "No video file provided" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const originalExt = path.extname(file.name || "") || ".mp4";
          const filename = `vlog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${originalExt}`;
          const uploadDir = path.resolve(process.cwd(), "public/uploads/videos");
          await fs.mkdir(uploadDir, { recursive: true });
          await fs.writeFile(path.join(uploadDir, filename), buffer);

          return new Response(JSON.stringify({ url: `/uploads/videos/${filename}` }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (uploadErr) {
          console.error("Video upload error:", uploadErr);
          return new Response(JSON.stringify({ error: "Failed to process video upload" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // 2. Direct Video Stream Handler (/uploads/videos/*)
      if (url.pathname.startsWith("/uploads/videos/") && request.method === "GET") {
        try {
          const filePath = path.resolve(process.cwd(), "public", url.pathname.replace(/^\//, ""));
          const fileHandle = await fs.readFile(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const contentType =
            ext === ".webm"
              ? "video/webm"
              : ext === ".mov"
              ? "video/quicktime"
              : ext === ".mkv"
              ? "video/x-matroska"
              : "video/mp4";

          return new Response(fileHandle, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Accept-Ranges": "bytes",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        } catch {
          // If file not found or reading error, fall through to main handler
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(error), {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  },
};
