import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  // This would serve the actual PDF files
  // For now, return a placeholder response
  const type = params.type; // 'english' or 'german'
  
  // In production, you'd retrieve the actual PDF from storage
  return new NextResponse("PDF content would be served here", {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${type}.pdf"`
    }
  });
}