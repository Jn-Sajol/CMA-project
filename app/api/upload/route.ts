import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if Cloudinary is fully configured
    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured) {
      // Upload to Cloudinary
      const base64Data = buffer.toString("base64");
      const fileUri = `data:${file.type};base64,${base64Data}`;
      
      const uploadResponse = await cloudinary.uploader.upload(fileUri, {
        folder: "cma-uploads",
      });

      return NextResponse.json({ url: uploadResponse.secure_url });
    } else {
      // Fallback: Upload locally to public/uploads
      const uploadDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const hash = crypto.randomBytes(8).toString("hex");
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${hash}-${sanitizedFilename}`;
      const filePath = join(uploadDir, filename);

      await writeFile(filePath, buffer);
      const fileUrl = `/uploads/${filename}`;

      return NextResponse.json({ url: fileUrl });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
