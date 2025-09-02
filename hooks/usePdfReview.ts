// hooks/usePdfReview.ts
import { useState } from 'react';

// --- Type Definitions ---
export type Correction = {
  originalPhrase: string;
  correction: string;
  reason: string;
};

export type ReviewData = {
  translatedPdfUrl: string;
  suggestions: Correction[];
  phrasesToHighlight: string[];
};

export function usePdfReview() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      // In a real app, you would use FormData and fetch
      // const formData = new FormData();
      // formData.append('file', file);
      // const response = await fetch('/api/process-pdf', { method: 'POST', body: formData });
      // if (!response.ok) throw new Error('Failed to process the PDF.');
      // const result: ReviewData = await response.json();

      // --- MOCK API CALL FOR DEVELOPMENT ---
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockData: ReviewData = {
        translatedPdfUrl: '/mock-translated-document.pdf',
        suggestions: [
          { originalPhrase: 'a quick brown fox', correction: 'a fast brown fox', reason: 'Synonym suggestion for better flow.' },
          { originalPhrase: 'jumps over the lazy dog', correction: 'leaps over the lazy dog', reason: 'More dynamic verb choice.' },
        ],
        phrasesToHighlight: ['a quick brown fox', 'jumps over the lazy dog'],
      };

      // Prefetch the PDF to ensure it's available before rendering
      const pdfResponse = await fetch(mockData.translatedPdfUrl);
      if (!pdfResponse.ok) {
        throw new Error('The mock translated PDF could not be found. Make sure it exists in your /public folder.');
      }
      // --- END MOCK ---

      setData(mockData);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return { data, isLoading, error, processFile, reset };
}