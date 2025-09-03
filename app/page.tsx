'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';

import { usePdfReview } from '../hooks/usePdfReview';
import { FileUpload } from './components/FileUpload';
import { PdfViewerLayout } from './components/PdfViewerLayout';
import { SuggestionsTable } from './components/SuggestionsTable';

export default function Home() {
  // Three file states
  const [originalPdf, setOriginalPdf] = useState<File | null>(null);
  const [groundTruthPdf, setGroundTruthPdf] = useState<File | null>(null);
  const [llmPdf, setLlmPdf] = useState<File | null>(null);

  // Object URLs for the file viewers
  const [originalPdfUrl, setOriginalPdfUrl] = useState('');
  const [groundTruthPdfUrl, setGroundTruthPdfUrl] = useState('');
  const [llmPdfUrl, setLlmPdfUrl] = useState('');
  const [highlightMessage, setHighlightMessage] = useState('');

  // PDF reviewer (must support 3-file upload)
  const { data: reviewData, isLoading, error, process, reset } = usePdfReview();

  // Plugins memoized
  const defaultLayoutPluginInstance = useMemo(() => defaultLayoutPlugin(), []);
  const searchPluginInstance = useMemo(() => searchPlugin(), []);
  const { highlight, clearHighlights } = searchPluginInstance;

  // Generate/revoke object URLs
  useEffect(() => {
    if (!originalPdf) { setOriginalPdfUrl(''); return; }
    const url = URL.createObjectURL(originalPdf);
    setOriginalPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalPdf]);
  useEffect(() => {
    if (!groundTruthPdf) { setGroundTruthPdfUrl(''); return; }
    const url = URL.createObjectURL(groundTruthPdf);
    setGroundTruthPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [groundTruthPdf]);
  useEffect(() => {
    if (reviewData?.translatedPdfUrl) { setLlmPdfUrl(reviewData.translatedPdfUrl); return; }
    if (!llmPdf) { setLlmPdfUrl(''); return; }
    const url = URL.createObjectURL(llmPdf);
    setLlmPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [llmPdf, reviewData?.translatedPdfUrl]);

  // LLM PDF highlight when phrases change
  useEffect(() => {
    if (!reviewData?.phrasesToHighlight || !llmPdfUrl) {
      clearHighlights();
      setHighlightMessage('');
      return;
    }
    highlight(
      reviewData.phrasesToHighlight.map(phrase => ({ keyword: phrase, matchCase: true }))
    ).then(matches => {
      if (!matches.length) setHighlightMessage('No translation mismatches found.');
      else setHighlightMessage(`Highlighted ${matches.length} phrase difference(s) in LLM PDF.`);
    }).catch(() => setHighlightMessage('Error while highlighting.'));
    return () => clearHighlights();
  }, [reviewData?.phrasesToHighlight, llmPdfUrl, highlight, clearHighlights]);

  // File validation
  const validatePdf = (file: File | null) => !file ? false : file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024;

  // Handler for each file upload control
  const handlePdfChange = (type: 'original' | 'groundTruth' | 'llm') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (!file) return;
      if (!validatePdf(file)) {
        alert('Please select a PDF file under 10MB.');
        e.target.value = '';
        return;
      }
      if (type === 'original') setOriginalPdf(file);
      if (type === 'groundTruth') setGroundTruthPdf(file);
      if (type === 'llm') setLlmPdf(file);
      reset();
      clearHighlights();
      setHighlightMessage('');
    };

  // Only enable process button when ALL three PDFs are loaded
  const canProcess = originalPdf && groundTruthPdf && llmPdf && !isLoading;

  // Fire processing of all three files (calls backend)
  const handleProcess = useCallback(() => {
    if (originalPdf && groundTruthPdf && llmPdf) {
      process(originalPdf, groundTruthPdf, llmPdf);
    }
  }, [originalPdf, groundTruthPdf, llmPdf, process]);

  // Reset everything (including highlights and reviewData)
  const handleReset = useCallback(() => {
    setOriginalPdf(null);
    setGroundTruthPdf(null);
    setLlmPdf(null);
    setOriginalPdfUrl('');
    setGroundTruthPdfUrl('');
    setLlmPdfUrl('');
    setHighlightMessage('');
    clearHighlights();
    reset();
  }, [reset, clearHighlights]);

  // ------ UI Layout
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

        {/* Upload Controls */}
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

        {/* Process Button */}
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

        {/* PDF Viewers (side-by-side, using new PdfViewerLayout API) */}
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

        {/* Suggestions Table & Start over */}
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