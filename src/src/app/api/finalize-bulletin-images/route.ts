import { NextRequest, NextResponse } from "next/server";
import { rename, mkdir, unlink } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tempImages } = body;

    if (!tempImages || !Array.isArray(tempImages)) {
      return NextResponse.json(
        { success: false, error: "No images provided" },
        { status: 400 }
      );
    }

    const movedImages: string[] = [];
    const errors: string[] = [];

    // Create permanent directory if it doesn't exist
    const permanentDir = path.join(
      process.cwd(),
      "public",
      "assets",
      "img",
      "bulletins",
      "permanent"
    );
    await mkdir(permanentDir, { recursive: true });

    for (const imageUrl of tempImages) {
      try {
        // Only process temporary images
        if (!imageUrl.includes("/bulletins/temp/")) {
          // Already permanent or not a bulletin image
          movedImages.push(imageUrl);
          continue;
        }

        const fileName = path.basename(imageUrl);
        const tempPath = path.join(process.cwd(), "public", imageUrl);
        const permanentPath = path.join(permanentDir, fileName);
        const newRelativePath = `/assets/img/bulletins/permanent/${fileName}`;

        // Move file from temp to permanent
        await rename(tempPath, permanentPath);
        movedImages.push(newRelativePath);
      } catch (error) {
        console.error(`Error moving image ${imageUrl}:`, error);
        errors.push(`Failed to move ${imageUrl}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Images moved to permanent storage",
      images: movedImages,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error moving images to permanent storage:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to move images",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
