import { NextRequest, NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const { type } = params;

    const allowedTypes: Record<string, string> = {
      english: "english.pdf",
      german: "groundtruth.pdf",
      llm: "translated.pdf",
    };

    if (!(type in allowedTypes)) {
      return new NextResponse("Invalid PDF type requested", { status: 400 });
    }

    const filename = allowedTypes[type];
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    const fileBuffer = await fs.readFile(filePath);
    const uint8Array = new Uint8Array(fileBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error serving PDF:", error);
    return new NextResponse("Failed to serve PDF", { status: 500 });
  }
}
