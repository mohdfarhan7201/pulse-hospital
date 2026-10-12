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

      // 1. Chunked Video Upload API (/api/upload-video-chunk) - Resilient hybrid storage
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

          // Fast & resilient disk storage (/tmp/pulse_chunks)
          const os = await import("os");
          const tmpBase = os.tmpdir();
          const uploadDir = path.join(tmpBase, "pulse_chunks", uploadId);
          await fs.mkdir(uploadDir, { recursive: true });

          const chunkPath = path.join(uploadDir, `chunk-${chunkIndex}`);
          await fs.writeFile(chunkPath, chunkBuffer);

          // Background sync to MongoDB video_chunks (non-blocking)
          try {
            const { connectToDatabase } = await import("./lib/server/mongodb");
            const mongoose = await connectToDatabase();
            const db = mongoose.connection.db;
            if (db) {
              await db.collection("video_chunks").updateOne(
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
            }
          } catch (dbErr) {
            console.warn("[Upload] MongoDB chunk sync skipped:", dbErr);
          }

          // Check if all chunks have arrived
          const files = await fs.readdir(uploadDir);
          const chunkFiles = files.filter((f) => f.startsWith("chunk-"));

          if (chunkFiles.length >= totalChunks) {
            const buffers: Buffer[] = [];
            for (let i = 0; i < totalChunks; i++) {
              const p = path.join(uploadDir, `chunk-${i}`);
              try {
                const b = await fs.readFile(p);
                buffers.push(b);
              } catch (readErr) {
                try {
                  const { connectToDatabase } = await import("./lib/server/mongodb");
                  const mongoose = await connectToDatabase();
                  const db = mongoose.connection.db;
                  if (db) {
                    const doc = await db.collection("video_chunks").findOne({ uploadId, chunkIndex: i });
                    if (doc && doc.data) {
                      buffers.push(Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data.buffer || doc.data));
                    }
                  }
                } catch {}
              }
            }

            if (buffers.length < totalChunks) {
              return new Response(
                JSON.stringify({
                  done: false,
                  chunkIndex,
                  received: buffers.length,
                  totalChunks,
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
              );
            }

            const fullBuffer = Buffer.concat(buffers);

            try {
              await fs.rm(uploadDir, { recursive: true, force: true });
            } catch {}

            const ext = path.extname(fileName || "") || ".mp4";
            const cleanFilename = `vlog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

            // Save assembled file to /tmp/pulse_videos
            const finalVideosDir = path.join(tmpBase, "pulse_videos");
            await fs.mkdir(finalVideosDir, { recursive: true });
            await fs.writeFile(path.join(finalVideosDir, cleanFilename), fullBuffer);

            // Also save to public/uploads/videos if writable
            try {
              const publicUploadDir = path.resolve(process.cwd(), "public/uploads/videos");
              await fs.mkdir(publicUploadDir, { recursive: true });
              await fs.writeFile(path.join(publicUploadDir, cleanFilename), fullBuffer);
            } catch {}

            // Save to GridFS if MongoDB is available
            try {
              const { connectToDatabase } = await import("./lib/server/mongodb");
              const mongoose = await connectToDatabase();
              const db = mongoose.connection.db;
              if (db) {
                const { GridFSBucket } = await import("mongodb");
                const bucket = new GridFSBucket(db, { bucketName: "videos" });
                const contentType =
                  ext === ".webm" ? "video/webm" : ext === ".mov" ? "video/quicktime" : "video/mp4";
                const uploadStream = bucket.openUploadStream(cleanFilename, { contentType });
                await new Promise<void>((res, rej) => uploadStream.end(fullBuffer, (err) => err ? rej(err) : res()));
                await db.collection("video_chunks").deleteMany({ uploadId });
                return new Response(
                  JSON.stringify({
                    done: true,
                    url: `/api/video/${uploadStream.id.toString()}`,
                  }),
                  { status: 200, headers: { "Content-Type": "application/json" } }
                );
              }
            } catch (gridErr) {
              console.warn("[Upload] GridFS save failed, using /api/video/file fallback:", gridErr);
            }

            return new Response(
              JSON.stringify({
                done: true,
                url: `/api/video/${cleanFilename}`,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }

          return new Response(
            JSON.stringify({
              done: false,
              chunkIndex,
              received: chunkFiles.length,
              totalChunks,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (chunkErr) {
          console.error("Chunk upload error:", chunkErr);
          const msg = chunkErr instanceof Error ? chunkErr.message : "Failed to process video chunk";
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
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

          // Primary: Store to MongoDB GridFS
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
          const os = await import("os");
          const tmpBase = os.tmpdir();
          const originalExt = path.extname(file.name || "") || ".mp4";
          const filename = `vlog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${originalExt}`;

          const finalVideosDir = path.join(tmpBase, "pulse_videos");
          await fs.mkdir(finalVideosDir, { recursive: true });
          await fs.writeFile(path.join(finalVideosDir, filename), buffer);

          try {
            const uploadDir = path.resolve(process.cwd(), "public/uploads/videos");
            await fs.mkdir(uploadDir, { recursive: true });
            await fs.writeFile(path.join(uploadDir, filename), buffer);
          } catch {}

          return new Response(JSON.stringify({ url: `/api/video/${filename}` }), {
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

      // 3. Resilient Video Stream Handler (/api/video/*) with HTTP 206 Range Support
      if (url.pathname.startsWith("/api/video/") && request.method === "GET") {
        try {
          const param = url.pathname.replace("/api/video/", "").trim();
          const os = await import("os");
          const tmpBase = os.tmpdir();

          // 1. Check /tmp/pulse_videos/<param>
          const tmpFilePath = path.join(tmpBase, "pulse_videos", param);
          let fileHandle: Buffer | null = null;
          try {
            fileHandle = await fs.readFile(tmpFilePath);
          } catch {}

          // 2. Check public/uploads/videos/<param>
          if (!fileHandle) {
            try {
              const publicPath = path.resolve(process.cwd(), "public/uploads/videos", param);
              fileHandle = await fs.readFile(publicPath);
            } catch {}
          }

          if (fileHandle) {
            const ext = path.extname(param).toLowerCase();
            const contentType =
              ext === ".webm"
                ? "video/webm"
                : ext === ".mov"
                ? "video/quicktime"
                : ext === ".mkv"
                ? "video/x-matroska"
                : "video/mp4";

            const fileSize = fileHandle.length;
            const range = request.headers.get("range");

            if (range) {
              const parts = range.replace(/bytes=/, "").split("-");
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
              const chunksize = end - start + 1;
              const sliced = fileHandle.subarray(start, end + 1);

              return new Response(sliced, {
                status: 206,
                headers: {
                  "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                  "Accept-Ranges": "bytes",
                  "Content-Length": String(chunksize),
                  "Content-Type": contentType,
                  "Cache-Control": "public, max-age=31536000, immutable",
                },
              });
            }

            return new Response(fileHandle, {
              status: 200,
              headers: {
                "Content-Length": String(fileSize),
                "Content-Type": contentType,
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=31536000, immutable",
              },
            });
          }

          // 3. Check MongoDB GridFS by ObjectId
          try {
            const { ObjectId, GridFSBucket } = await import("mongodb");
            if (ObjectId.isValid(param)) {
              const { connectToDatabase } = await import("./lib/server/mongodb");
              const mongoose = await connectToDatabase();
              const db = mongoose.connection.db;
              if (db) {
                const fileObjId = new ObjectId(param);
                const fileMeta = await db.collection("videos.files").findOne({ _id: fileObjId });
                if (fileMeta) {
                  const bucket = new GridFSBucket(db, { bucketName: "videos" });
                  const fileSize = fileMeta.length;
                  const contentType = fileMeta.contentType || "video/mp4";
                  const range = request.headers.get("range");

                  if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunksize = end - start + 1;
                    const stream = bucket.openDownloadStream(fileObjId, { start, end: end + 1 });
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
                }
              }
            }
          } catch {}

          return new Response("Video not found", { status: 404 });
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
