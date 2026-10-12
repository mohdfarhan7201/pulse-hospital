import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "bgtihhit",
  api_key: process.env.CLOUDINARY_API_KEY || "783247339573847",
  api_secret: process.env.CLOUDINARY_API_SECRET || "2fVT0fzjIbNjhId0M6fpYLjqW8g",
  secure: true,
});

/**
 * Upload video buffer to Cloudinary
 */
export async function uploadVideoBuffer(buffer: Buffer, originalFilename?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "pulse_hospital/videos",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary video upload failed"));
        } else {
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
}

/**
 * Upload image (Base64 string or URL) to Cloudinary
 */
export async function uploadImage(input: string): Promise<string> {
  if (!input) return "";
  // If already hosted on cloud or external CDN, keep as is
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }
  const result = await cloudinary.uploader.upload(input, {
    resource_type: "image",
    folder: "pulse_hospital/images",
  });
  return result.secure_url;
}

export { cloudinary };
