'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';

import { usePdfReview } from '../hooks/usePdfReview';
import { FileUpload } from './components/FileUpload';
import { PdfViewerLayout } from './components/PdfViewerLayout';
import { SuggestionsTable } from './components/SuggestionsTable';

export default function Home() {
  // File states
  const [originalPdf, setOriginalPdf] = useState<File | null>(null);
  const [groundTruthPdf, setGroundTruthPdf] = useState<File | null>(null);
  const [llmPdf, setLlmPdf] = useState<File | null>(null);

  // Object URLs
  const [originalPdfUrl, setOriginalPdfUrl] = useState('');
  const [llmPdfUrl, setLlmPdfUrl] = useState('');
  const [highlightMessage, setHighlightMessage] = useState('');

  const { data: reviewData, isLoading, error, process, reset } = usePdfReview();

  // Memoize plugins ONCE per mount, so highlight/clearHighlights never change!
  const defaultLayoutPluginInstance = useMemo(() => defaultLayoutPlugin(), []);
  const searchPluginInstance = useMemo(() => searchPlugin(), []);
  const { highlight, clearHighlights } = searchPluginInstance;

  // Object URL lifecycle for English original
  useEffect(() => {
    if (!originalPdf) {
      setOriginalPdfUrl('');
      return;
    }
    const url = URL.createObjectURL(originalPdf);
    setOriginalPdfUrl(url);
    return () => { URL.revokeObjectURL(url); };
  }, [originalPdf]);

  // Object URL/response for LLM German output
  useEffect(() => {
    if (reviewData?.translatedPdfUrl) {
      setLlmPdfUrl(reviewData.translatedPdfUrl);
      return;
    }
    if (!llmPdf) {
      setLlmPdfUrl('');
      return;
    }
    const url = URL.createObjectURL(llmPdf);
    setLlmPdfUrl(url);
    return () => { URL.revokeObjectURL(url); };
  }, [llmPdf, reviewData?.translatedPdfUrl]);

  // Highlighting effect (uses a guard flag, **no highlight/clearHighlights deps**)
  useEffect(() => {
    let active = true;
    if (!reviewData?.phrasesToHighlight || !llmPdfUrl) {
      clearHighlights();
      setHighlightMessage('');
      return;
    }
    highlight(
      reviewData.phrasesToHighlight.map(phrase => ({ keyword: phrase, matchCase: true }))
    ).then(matches => {
      if (!active) return;
      if (!matches.length) setHighlightMessage('No translation mismatches found.');
      else setHighlightMessage(`Highlighted ${matches.length} phrase difference(s) in LLM PDF.`);
    }).catch(() => {
      if (active) setHighlightMessage('Error while highlighting.');
    });
    return () => {
      active = false;
      clearHighlights();
    };
    // Only depend on state/refs that affect highlighting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewData?.phrasesToHighlight, llmPdfUrl]);

  // Memoize validatePdf so handlePdfChange is stable
  const validatePdf = useCallback(
    (file: File | null) =>
      !!file && file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024,
    []
  );

  // Stable, dependency-safe file-upload handler
  const handlePdfChange = useCallback(
    (which: 'original' | 'groundTruth' | 'llm') =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (!file) return;
        if (!validatePdf(file)) {
          alert('Please select a valid PDF file under 10MB.');
          e.target.value = '';
          return;
        }
        if (which === 'original') setOriginalPdf(file);
        if (which === 'groundTruth') setGroundTruthPdf(file);
        if (which === 'llm') setLlmPdf(file);
        reset();
        clearHighlights();
        setHighlightMessage('');
      },
    [validatePdf, reset, clearHighlights]
  );

  const canProcess = originalPdf && groundTruthPdf && llmPdf && !isLoading;

  const handleProcess = useCallback(() => {
    if (originalPdf && groundTruthPdf && llmPdf) {
      process(originalPdf, groundTruthPdf, llmPdf);
    }
  }, [originalPdf, groundTruthPdf, llmPdf, process]);

  const handleReset = useCallback(() => {
    setOriginalPdf(null);
    setGroundTruthPdf(null);
    setLlmPdf(null);
    setOriginalPdfUrl('');
    setLlmPdfUrl('');
    setHighlightMessage('');
    clearHighlights();
    reset();
  }, [reset, clearHighlights]);

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-100 flex flex-col items-center">
      <div className="max-w-7xl w-full">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">PDF Translation Reviewer</h1>
          <p className="text-gray-700 mt-2">
            1. Upload the English original, ground-truth German PDF, and LLM German PDF.<br />
            2. The system will highlight translation mismatches in the LLM output (right pane).
          </p>
        </header>

        {/* File uploaders */}
        {!reviewData && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <FileUpload
              label="English Original PDF"
              accept="application/pdf"
              disabled={isLoading}
              file={originalPdf}
              onFileChange={handlePdfChange('original')}
            />
            <FileUpload
              label="Ground-Truth German PDF"
              accept="application/pdf"
              disabled={isLoading}
              file={groundTruthPdf}
              onFileChange={handlePdfChange('groundTruth')}
            />
            <FileUpload
              label="LLM-Generated German PDF"
              accept="application/pdf"
              disabled={isLoading}
              file={llmPdf}
              onFileChange={handlePdfChange('llm')}
            />
          </div>
        )}

        {/* Buttons */}
        {!reviewData && (
          <div className="mb-8 flex justify-center space-x-2">
            <button
              onClick={handleProcess}
              disabled={!canProcess}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
            >
              {isLoading ? 'Processing...' : 'Process and Review'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
            >
              Reset
            </button>
          </div>
        )}

        {/* PDF Viewers */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <PdfViewerLayout
            title="English Original"
            fileUrl={originalPdfUrl}
            pluginInstances={[defaultLayoutPluginInstance]}
          />
          <PdfViewerLayout
            title="LLM German"
            fileUrl={llmPdfUrl}
            pluginInstances={[defaultLayoutPluginInstance, searchPluginInstance]}
            highlightMessage={highlightMessage}
          />
        </div>

        {/* Suggestions Table and start new review */}
        {reviewData && (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Start New Review
              </button>
            </div>
            <SuggestionsTable suggestions={reviewData.suggestions ?? []} />
          </>
        )}

        {error && (
          <div className="mt-4 text-red-600 font-semibold text-center">{error}</div>
        )}
      </div>
    </main>
  );
}