import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { diffWords } from 'diff';

// Allow only up to 10 MB files
const MAX_FILE_SIZE = 10 * 1024 * 1024; // bytes

function isPDF(file: File): boolean {
  return file.type === 'application/pdf' && file.name.endsWith('.pdf');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const originalFile = formData.get('original') as File | null;
    const groundTruthFile = formData.get('groundTruth') as File | null;
    const llmFile = formData.get('llm') as File | null;

    // NULL CHECK - Add this section
    if (!originalFile || !groundTruthFile || !llmFile) {
      return NextResponse.json({ error: 'All files must be provided.' }, { status: 400 });
    }

    // Validate files
    for (const file of [originalFile, groundTruthFile, llmFile]) {
      if (!isPDF(file)) {
        return NextResponse.json({ error: 'All files must be valid PDFs.' }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Files must not exceed 10MB.' }, { status: 400 });
      }
    }

    // Create a unique folder for this upload session
    const sessionId = uuidv4();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
    await fs.mkdir(uploadsDir, { recursive: true });

    // Save all three PDFs with canonical names
    const saveFile = async (file: File, canonicalName: string) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(uploadsDir, canonicalName), buffer);
      return buffer;
    };

    // Now TypeScript knows these are not null
    const originalBuffer = await saveFile(originalFile, 'english.pdf');
    const groundTruthBuffer = await saveFile(groundTruthFile, 'groundtruth.pdf');
    const llmBuffer = await saveFile(llmFile, 'translated.pdf');

    // Extract text from groundTruth and llm PDFs
    const groundTruthData = await pdfParse(groundTruthBuffer);
    const llmTextData = await pdfParse(llmBuffer);

    // Use jsdiff to extract mismatched words/phrases
    const diffs = diffWords(groundTruthData.text, llmTextData.text);
    const phrasesToHighlight = diffs
      .filter(part => part.removed)
      .map(part => part.value.trim())
      .filter(Boolean);

    // Prepare suggestions
    const suggestions = phrasesToHighlight.map(phrase => ({
      originalPhrase: phrase,
      correction: 'Suggested fix here', // Replace as needed
      reason: 'Differs from ground truth',
    }));

    // Return session file URLs so frontend can request them if needed
    const baseUrl = `/uploads/${sessionId}`;
    return NextResponse.json({
      translatedPdfUrl: `${baseUrl}/translated.pdf`,
      englishPdfUrl: `${baseUrl}/english.pdf`,
      groundTruthPdfUrl: `${baseUrl}/groundtruth.pdf`,
      phrasesToHighlight,
      suggestions,
      sessionId, // (So client can retrieve the correct PDF set)
    });
  } catch (error: any) {
    console.error('Error in /api/process-pdf:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process PDFs.' },
      { status: 500 }
    );
  }
}
