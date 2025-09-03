import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const original = data.get('original') as File;
    const groundTruth = data.get('groundTruth') as File;
    const llm = data.get('llm') as File;

    if (!original || !groundTruth || !llm) {
      return NextResponse.json({ error: 'All three files required' }, { status: 400 });
    }

    // TODO: Extract text, run diff, etc.

    return NextResponse.json({
      translatedPdfUrl: '/uploads/translated.pdf',
      suggestions: [
        {
          originalPhrase: 'example error',
          correction: 'example fix',
          reason: 'demo reason',
        },
      ],
      phrasesToHighlight: ['example error'],
    });
  } catch (err) {
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}