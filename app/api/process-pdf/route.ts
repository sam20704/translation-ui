// app/api/process-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';

// Simple text difference extraction (can be replaced with a better diff algorithm)
function extractMismatchedPhrases(text1: string, text2: string): string[] {
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  const diffs: string[] = [];
  words1.forEach((word, i) => {
    if (word !== words2[i]) {
      diffs.push(word);
    }
  });
  return [...new Set(diffs)]; // unique mismatches
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();

    const originalFile = data.get('original') as File | null;
    const groundTruthFile = data.get('groundTruth') as File | null;
    const llmFile = data.get('llm') as File | null;

    if (!originalFile || !groundTruthFile || !llmFile) {
      return NextResponse.json(
        { error: 'All three PDF files (original, groundTruth, llm) are required' },
        { status: 400 }
      );
    }

    // Save LLM PDF file to public/uploads/translated.pdf
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const llmBuffer = Buffer.from(await llmFile.arrayBuffer());
    const savePath = path.join(uploadsDir, 'translated.pdf');
    await fs.writeFile(savePath, llmBuffer);

    // Extract text from groundTruth PDF
    const groundTruthBuffer = Buffer.from(await groundTruthFile.arrayBuffer());
    const groundTruthData = await pdfParse(groundTruthBuffer);
    const groundTruthText = groundTruthData.text;

    // Extract text from llm PDF
    const llmTextData = await pdfParse(llmBuffer);
    const llmText = llmTextData.text;

    // Find mismatched phrases between groundTruth and llm texts
    const phrasesToHighlight = extractMismatchedPhrases(groundTruthText, llmText);

    // Generate suggestions array (simple example for demo)
    const suggestions = phrasesToHighlight.map((phrase) => ({
      originalPhrase: phrase,
      correction: 'Expected correct phrase', // Replace with actual diff logic
      reason: 'Mismatch found vs. ground-truth PDF',
    }));

    // Return JSON response to frontend
    return NextResponse.json({
      translatedPdfUrl: '/uploads/translated.pdf',
      phrasesToHighlight,
      suggestions,
    });
  } catch (error) {
    console.error('Error processing PDFs:', error);
    return NextResponse.json(
      { error: 'Failed to process PDFs. Please try again.' },
      { status: 500 }
    );
  }
}
