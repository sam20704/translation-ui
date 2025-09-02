'use client';

import { useState, useEffect, useMemo } from 'react';

// Import types and plugins from the PDF viewer library
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import type { Match } from '@react-pdf-viewer/search';

// Import our new components and the custom hook
import { usePdfReview } from '../hooks/usePdfReview'; // Correct path to hooks folder
import { FileUpload } from './components/FileUpload';
import { PdfViewerLayout } from './components/PdfViewerLayout';
import { SuggestionsTable } from './components/SuggestionsTable';

export default function Home() {
  // State for the uploaded file itself
  const [originalPdfFile, setOriginalPdfFile] = useState<File | null>(null);
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string>('');
  
  // Custom hook now manages all API state (data, loading, error)
  const { data: reviewData, isLoading, error, processFile, reset } = usePdfReview();

  // State for UI feedback specific to this page
  const [highlightMessage, setHighlightMessage] = useState<string>('');

  // Memoize plugin instances so they don't get recreated on every render.
  // This is a performance optimization.
  const { defaultLayoutPluginInstance, searchPluginInstance } = useMemo(() => {
    const defaultLayoutPluginInstance = defaultLayoutPlugin();
    const searchPluginInstance = searchPlugin();
    return { defaultLayoutPluginInstance, searchPluginInstance };
  }, []);
  
  const { highlight, clearHighlights } = searchPluginInstance;

  // Effect for handling highlights - with the corrected type for `matches`
  useEffect(() => {
    if (reviewData?.phrasesToHighlight && reviewData.phrasesToHighlight.length > 0) {
      highlight(
        reviewData.phrasesToHighlight.map(phrase => ({ keyword: phrase, matchCase: true }))
      ).then((matches: Match[]) => {
        // CORRECTED: Check the length of the results array to see if any matches were found.
        if (matches.length === 0) {
          setHighlightMessage('Note: AI suggestions were generated, but the exact phrases were not found to apply highlights.');
        } else {
          setHighlightMessage('');
        }
      }).catch(error => {
          console.error("Error during highlighting:", error);
          // Optionally, you could set an error state here
      });
    }
  }, [reviewData, highlight]);

  // Effect for creating and revoking the temporary PDF URL to prevent memory leaks
  useEffect(() => {
    if (!originalPdfFile) return;
    const url = URL.createObjectURL(originalPdfFile);
    setOriginalPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalPdfFile]);

  // Handler for when a new file is selected by the user
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOriginalPdfFile(e.target.files[0]);
      reset(); // Reset the API state from our custom hook
      clear(); // Clear any old highlights from the viewer plugin
    }
  };
  
  // Handler to start the review process
  const handleProcessAndReview = () => {
    if (originalPdfFile) {
      processFile(originalPdfFile);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-gray-100">
      <div className="w-full max-w-7xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800">PDF Translation Reviewer</h1>
          <p className="text-gray-600 mt-2">Upload a PDF, see the translation, and get AI-powered corrections.</p>
        </header>

        {/* --- Main Conditional Rendering --- */}
        {/* If we have review data, show the results. Otherwise, show the upload form. */}
        {reviewData ? (
          <>
            <PdfViewerLayout
              originalPdfUrl={originalPdfUrl}
              translatedPdfUrl={reviewData.translatedPdfUrl}
              highlightMessage={highlightMessage}
              defaultLayoutPlugin={defaultLayoutPluginInstance}
              searchPlugin={searchPluginInstance}
            />
            <SuggestionsTable suggestions={reviewData.suggestions} />
          </>
        ) : (
          <FileUpload
            onFileChange={handleFileChange}
            onProcess={handleProcessAndReview}
            isLoading={isLoading}
            disabled={!originalPdfFile}
            errorMessage={error}
          />
        )}
      </div>
    </main>
  );
}