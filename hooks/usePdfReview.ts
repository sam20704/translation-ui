import { useState } from 'react';

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

  const process = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/process-pdf', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Failed to process PDF');

      const result: ReviewData = await response.json();

      // Optional: Prefetch PDF to ensure availability
      const pdfResponse = await fetch(result.translatedPdfUrl);
      if (!pdfResponse.ok) throw new Error('Translated PDF not found');

      setData(result);
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return { data, isLoading, error, process, reset };
}
