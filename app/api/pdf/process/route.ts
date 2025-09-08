// app/api/pdf/process/route.ts

// Polyfill to ensure pdfjs-dist works correctly in Next.js
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { diffWords } from 'diff';

// Allow only up to 10 MB files
const MAX_FILE_SIZE = 10 * 1024 * 1024; // bytes

function isPDF(file: File): boolean {
  return file.type === 'application/pdf' && file.name.toLowerCase().endsWith('.pdf');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const originalFile = formData.get('original') as File | null;
    const groundTruthFile = formData.get('groundTruth') as File | null;
    const llmFile = formData.get('llm') as File | null;

    // Validate inputs
    if (!originalFile || !groundTruthFile || !llmFile) {
      return NextResponse.json({ error: 'All three PDF files (original, groundTruth, llm) are required' }, { status: 400 });
    }
    for (const file of [originalFile, groundTruthFile, llmFile]) {
      if (!isPDF(file)) {
        return NextResponse.json({ error: 'All files must be valid PDFs.' }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Files must not exceed 10MB.' }, { status: 400 });
      }
    }

    // Create a unique folder for this session
    const sessionId = uuidv4();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Helper to save a file and return its buffer
    const saveFile = async (file: File, name: string) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(uploadsDir, name), buffer);
      return buffer;
    };

    const originalBuffer = await saveFile(originalFile, 'english.pdf');
    const groundTruthBuffer = await saveFile(groundTruthFile, 'groundtruth.pdf');
    const llmBuffer = await saveFile(llmFile, 'translated.pdf');

    // Extract text
    const [groundData, llmData] = await Promise.all([
      pdfParse(groundTruthBuffer),
      pdfParse(llmBuffer),
    ]);

    // Compute diffs
    const diffs = diffWords(groundData.text, llmData.text);
    const phrasesToHighlight = diffs
      .filter(part => part.removed)
      .map(part => part.value.trim())
      .filter(Boolean);

    // Build suggestions
    const suggestions = phrasesToHighlight.map(phrase => ({
      originalPhrase: phrase,
      correction: 'Suggested fix here',
      reason: 'Differs from ground truth',
    }));

    // Return URLs and results
    const baseUrl = `/uploads/${sessionId}`;
    return NextResponse.json({
      translatedPdfUrl: `${baseUrl}/translated.pdf`,
      englishPdfUrl: `${baseUrl}/english.pdf`,
      groundTruthPdfUrl: `${baseUrl}/groundtruth.pdf`,
      phrasesToHighlight,
      suggestions,
      sessionId,
    });
  } catch (err: any) {
    console.error('Error in /api/pdf/process:', err);
    return NextResponse.json({ error: err.message || 'Failed to process PDFs.' }, { status: 500 });
  }
}
