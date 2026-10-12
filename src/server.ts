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

      // 1. Chunked Video Upload API (/api/upload-video-chunk) - Prevents 413 on Vercel
      if (url.pathname === "/api/upload-video-chunk" && request.method === "POST") {
        try {
          const formData = await request.formData();
          const uploadId = (formData.get("uploadId") as string) || "";
          const chunkIndex = parseInt((formData.get("chunkIndex") as string) || "0", 10);
          const totalChunks = parseInt((formData.get("totalChunks") as string) || "1", 10);
          const fileName = (formData.get("fileName") as string) || "video.mp4";
          const chunkFile = formData.get("chunk") as File | null;

          if (!uploadId || !chunkFile) {
            return new Response(JSON.stringify({ error: "Missing upload parameters" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const chunkBytes = await chunkFile.arrayBuffer();
          const chunkBuffer = Buffer.from(chunkBytes);

          const { connectToDatabase } = await import("./lib/server/mongodb");
          const mongoose = await connectToDatabase();
          const db = mongoose.connection.db;
          if (!db) {
            throw new Error("Database connection not ready");
          }

          const chunksCol = db.collection("video_chunks");
          await chunksCol.updateOne(
            { uploadId, chunkIndex },
            {
              $set: {
                uploadId,
                chunkIndex,
                totalChunks,
                fileName,
                data: chunkBuffer,
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          );

          // Check if all chunks have been received
          const count = await chunksCol.countDocuments({ uploadId });
          if (count >= totalChunks) {
            const allChunks = await chunksCol
              .find({ uploadId })
              .sort({ chunkIndex: 1 })
              .toArray();

            const fullBuffer = Buffer.concat(
              allChunks.map((c) => {
                const d = c.data;
                return Buffer.isBuffer(d) ? d : Buffer.from(d.buffer || d);
              })
            );

            // Clean up temporary chunks
            await chunksCol.deleteMany({ uploadId });

            // Store assembled video into MongoDB GridFS
            const { GridFSBucket } = await import("mongodb");
            const bucket = new GridFSBucket(db, { bucketName: "videos" });
            const ext = path.extname(fileName || "") || ".mp4";
            const contentType =
              ext === ".webm"
                ? "video/webm"
                : ext === ".mov"
                ? "video/quicktime"
                : "video/mp4";

            const uploadStream = bucket.openUploadStream(fileName, {
              contentType,
            });

            await new Promise<void>((resolve, reject) => {
              uploadStream.end(fullBuffer, (err?: Error | null) => {
                if (err) reject(err);
                else resolve();
              });
            });

            const fileId = uploadStream.id.toString();
            return new Response(
              JSON.stringify({
                done: true,
                url: `/api/video/${fileId}`,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          return new Response(
            JSON.stringify({
              done: false,
              chunkIndex,
              received: count,
              totalChunks,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (chunkErr) {
          console.error("Chunk upload error:", chunkErr);
          return new Response(
            JSON.stringify({ error: "Failed to process video chunk" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // 2. Direct Video File Upload API (/api/upload-video)
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

          // Primary: Store to MongoDB GridFS (Works 100% on Vercel without ephemeral loss)
          try {
            const { connectToDatabase } = await import("./lib/server/mongodb");
            const mongoose = await connectToDatabase();
            const db = mongoose.connection.db;
            if (db) {
              const { GridFSBucket } = await import("mongodb");
              const bucket = new GridFSBucket(db, { bucketName: "videos" });
              const ext = path.extname(file.name || "") || ".mp4";
              const contentType =
                ext === ".webm"
                  ? "video/webm"
                  : ext === ".mov"
                  ? "video/quicktime"
                  : "video/mp4";

              const uploadStream = bucket.openUploadStream(file.name, {
                contentType,
              });

              await new Promise<void>((resolve, reject) => {
                uploadStream.end(buffer, (err?: Error | null) => {
                  if (err) reject(err);
                  else resolve();
                });
              });

              return new Response(
                JSON.stringify({ url: `/api/video/${uploadStream.id.toString()}` }),
                {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                }
              );
            }
          } catch (gridErr) {
            console.warn("GridFS direct upload failed, trying Cloudinary/disk fallback:", gridErr);
          }

          // Fallback 1: Cloudinary
          try {
            const { uploadVideoBuffer } = await import("./lib/server/cloudinary");
            const cloudinaryUrl = await uploadVideoBuffer(buffer, file.name);
            return new Response(JSON.stringify({ url: cloudinaryUrl }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } catch (cloudErr) {
            console.warn("Cloudinary upload failed, falling back to local storage:", cloudErr);
          }

          // Fallback 2: Local storage
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

      // 3. GridFS Video Stream Handler (/api/video/*) with HTTP 206 Range Support
      if (url.pathname.startsWith("/api/video/") && request.method === "GET") {
        try {
          const fileIdStr = url.pathname.replace("/api/video/", "").trim();
          const { ObjectId, GridFSBucket } = await import("mongodb");
          if (!ObjectId.isValid(fileIdStr)) {
            return new Response("Invalid video ID", { status: 400 });
          }

          const { connectToDatabase } = await import("./lib/server/mongodb");
          const mongoose = await connectToDatabase();
          const db = mongoose.connection.db;
          if (!db) {
            return new Response("Database error", { status: 500 });
          }

          const fileObjId = new ObjectId(fileIdStr);
          const fileMeta = await db.collection("videos.files").findOne({ _id: fileObjId });
          if (!fileMeta) {
            return new Response("Video not found", { status: 404 });
          }

          const bucket = new GridFSBucket(db, { bucketName: "videos" });
          const fileSize = fileMeta.length;
          const contentType = fileMeta.contentType || "video/mp4";

          const range = request.headers.get("range");
          if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;

            const stream = bucket.openDownloadStream(fileObjId, {
              start,
              end: end + 1,
            });

            const webStream = new ReadableStream({
              start(controller) {
                stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
                stream.on("end", () => controller.close());
                stream.on("error", (err) => controller.error(err));
              },
            });

            return new Response(webStream, {
              status: 206,
              headers: {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": String(chunksize),
                "Content-Type": contentType,
                "Cache-Control": "public, max-age=31536000, immutable",
              },
            });
          } else {
            const stream = bucket.openDownloadStream(fileObjId);
            const webStream = new ReadableStream({
              start(controller) {
                stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
                stream.on("end", () => controller.close());
                stream.on("error", (err) => controller.error(err));
              },
            });

            return new Response(webStream, {
              status: 200,
              headers: {
                "Content-Length": String(fileSize),
                "Content-Type": contentType,
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=31536000, immutable",
              },
            });
          }
        } catch (streamErr) {
          console.error("Video stream error:", streamErr);
          return new Response("Failed to stream video", { status: 500 });
        }
      }

      // 4. Local File Video Stream Handler (/uploads/videos/*)
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
