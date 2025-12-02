import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file received" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid file type. Only JPG, JPEG, PNG, GIF, and WEBP are allowed.",
        },
        { status: 400 }
      );
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const fileName = `bulletin_${timestamp}${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Build full path for temporary bulletin images
    // Store in public/assets/img/bulletins/temp/ first
    const relativePath = `/assets/img/bulletins/temp/${fileName}`;
    const fullPath = path.join(process.cwd(), "public", relativePath);

    // Create directory if it doesn't exist
    const dirPath = path.dirname(fullPath);
    await mkdir(dirPath, { recursive: true });

    // Write file
    await writeFile(fullPath, buffer);

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      url: relativePath,
      fileName: fileName,
    });
  } catch (error) {
    console.error("Error uploading bulletin image:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
