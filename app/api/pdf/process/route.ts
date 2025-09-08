// File: app/api/pdf/process/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { diffWords } from 'diff';

// --- DEFINITIVE PDF PARSING SETUP for Next.js Server Environment ---
// Import from the main entry to get TypeScript types.
import * as pdfjs from 'pdfjs-dist';

// Use require.resolve to get the absolute path to the worker script for the runtime.
// This combination satisfies both TypeScript and the Next.js runtime.
pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.mjs');


// --- CONSTANTS AND HELPERS ---

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

function isPDF(file: File): boolean {
  return file.type === 'application/pdf' && file.name.toLowerCase().endsWith('.pdf');
}

async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText.trim();
}


// --- API ROUTE HANDLER ---

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const originalFile = formData.get('original') as File | null;
    const groundTruthFile = formData.get('groundTruth') as File | null;
    const llmFile = formData.get('llm') as File | null;

    // 1. Validate inputs
    if (!originalFile || !groundTruthFile || !llmFile) {
      return NextResponse.json({ error: 'All three PDF files (original, groundTruth, llm) are required' }, { status: 400 });
    }
    for (const file of [originalFile, groundTruthFile, llmFile]) {
      if (!isPDF(file)) {
        return NextResponse.json({ error: 'All files must be valid PDFs.' }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File "${file.name}" exceeds the 10MB limit.` }, { status: 400 });
      }
    }

    // 2. Create a unique folder and save files
    const sessionId = uuidv4();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', sessionId);
    await fs.mkdir(uploadsDir, { recursive: true });

    const saveFile = async (file: File, name: string): Promise<Buffer> => {
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(uploadsDir, name), buffer);
      return buffer;
    };

    const [originalBuffer, groundTruthBuffer, llmBuffer] = await Promise.all([
      saveFile(originalFile, 'english.pdf'),
      saveFile(groundTruthFile, 'groundtruth.pdf'),
      saveFile(llmFile, 'translated.pdf')
    ]);

    // 3. Extract text using the robust method
    const [groundTruthText, llmText] = await Promise.all([
      extractTextFromPdf(groundTruthBuffer),
      extractTextFromPdf(llmBuffer),
    ]);

    // 4. Compute differences
    const diffs = diffWords(groundTruthText, llmText);
    const phrasesToHighlight = diffs
      .filter(part => part.removed)
      .map(part => part.value.trim())
      .filter(Boolean);

    const suggestions = phrasesToHighlight.map(phrase => ({
      originalPhrase: phrase,
      correction: 'Suggested fix here',
      reason: 'Differs from ground truth',
    }));

    // 5. Return URLs and results
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