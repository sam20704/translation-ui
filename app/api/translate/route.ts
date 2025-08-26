import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest) {
  try {
    // Parse the uploaded file
    const data = await request.formData();
    const file = data.get('pdf') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert File to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF (simplified - you'd use a proper PDF parser)
    const pdfDoc = await PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    
    // Mock text extraction (you'd use pdf-parse or similar)
    const extractedText = "Sample extracted text from PDF for translation...";

    // Call DeepL API for translation
    const translatedText = await translateWithDeepL(extractedText);
    
    // Generate translated PDF (simplified)
    const translatedPdfBuffer = await createTranslatedPDF(translatedText);
    
    // Analyze with LLM reflection agent
    const analysisResult = await analyzeTranslation(extractedText, translatedText);

    return NextResponse.json({
      originalText: extractedText,
      translatedText,
      analysisResult,
      originalPdf: buffer.toString('base64'),
      translatedPdf: translatedPdfBuffer.toString('base64')
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}

async function translateWithDeepL(text: string): Promise<string> {
  const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
  const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'text': text,
        'source_lang': 'EN',
        'target_lang': 'DE'
      })
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status}`);
    }

    const result = await response.json();
    return result.translations[0].text;
  } catch (error) {
    console.error('DeepL translation error:', error);
    // Return mock translation for development
    return "Dies ist ein Beispiel für übersetzten Text vom DeepL API...";
  }
}

async function createTranslatedPDF(translatedText: string): Promise<Buffer> {
  // Create a new PDF with the translated text
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  
  const { width, height } = page.getSize();
  
  page.drawText(translatedText, {
    x: 50,
    y: height - 50,
    size: 12,
    maxWidth: width - 100,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

async function analyzeTranslation(original: string, translated: string) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  const prompt = `
    You are a professional translation quality assessment agent. Analyze the following English to German translation and identify:
    1. Mistranslations (incorrect translations based on context)
    2. Omissions (text that was not translated)
    3. Provide suggestions for improvement
    
    Original English text: "${original}"
    German translation: "${translated}"
    
    Return a JSON array of issues with the following structure:
    {
      "errors": [
        {
          "type": "mistranslation" | "omission",
          "originalText": "...",
          "translatedText": "...",
          "suggestion": "...",
          "confidence": 0.85,
          "page": 1
        }
      ]
    }
  `;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translation quality assessment expert.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    console.error('LLM analysis error:', error);
    // Return mock analysis for development
    return {
      errors: [
        {
          type: "mistranslation",
          originalText: "quarterly earnings",
          translatedText: "vierteljährliche Einnahmen",
          suggestion: "Use 'Gewinne' instead of 'Einnahmen' for earnings in financial context",
          confidence: 0.85,
          page: 1
        }
      ]
    };
  }
}