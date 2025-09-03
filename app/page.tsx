'use client';

import { useState, useEffect, useMemo } from 'react';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import type { Plugin } from '@react-pdf-viewer/core';

import { usePdfReview } from '../hooks/usePdfReview';

import { FileUpload } from './components/FileUpload'; // Your existing component to select PDF files
import { PdfViewerLayout } from './components/PdfViewerLayout'; // Layout component for side-by-side viewers
import { SuggestionsTable } from './components/SuggestionsTable'; // Component to display suggestions

export default function Home() {
  const [originalPdfFile, setOriginalPdfFile] = useState<File | null>(null);
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string>('');
  const { data: reviewData, isLoading, error, process, reset } = usePdfReview();
  const [highlightMessage, setHighlightMessage] = useState<string>('');

  // Create plugin instances once (memoized)
  const { defaultLayoutPluginInstance, searchPluginInstance } = useMemo(() => {
    return {
      defaultLayoutPluginInstance: defaultLayoutPlugin(),
      searchPluginInstance: searchPlugin(),
    };
  }, []);

  const { highlight, clearHighlights } = searchPluginInstance;

  // Synchronize highlights based on backend phrases
  useEffect(() => {
    if (reviewData?.phrasesToHighlight && reviewData.phrasesToHighlight.length > 0) {
      highlight(
        reviewData.phrasesToHighlight.map(phrase => ({
          keyword: phrase,
          matchCase: true,
        }))
      ).then(matches => {
        if (matches.length === 0) {
          setHighlightMessage('Note: No matching phrases found in PDF for highlighting.');
        } else {
          setHighlightMessage('');
        }
      }).catch(() => {
        setHighlightMessage('');
      });
    } else {
      clearHighlights();
      setHighlightMessage('');
    }
  }, [reviewData, highlight, clearHighlights]);

  // Create URL object from uploaded file
  useEffect(() => {
    if (!originalPdfFile) {
      setOriginalPdfUrl('');
      return;
    }
    const url = URL.createObjectURL(originalPdfFile);
    setOriginalPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [originalPdfFile]);

  const handleFileChange = (file: File) => {
    setOriginalPdfFile(file);
    reset();
    clearHighlights();
    setHighlightMessage('');
  };

  // Trigger backend processing
  const handleProcess = () => {
    if (originalPdfFile) process(originalPdfFile);
  };

  return (
    <main className='flex flex-col items-center min-h-screen p-4 md:p-8 bg-gray-100'>
      <div className='w-full max-w-7xl'>
        <header className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900'>PDF Translation Reviewer</h1>
          <p className='text-gray-700 mt-2'>Upload your PDF and review translation errors highlighted in the document.</p>
        </header>

        {!reviewData && (
          <FileUpload 
            disabled={isLoading}
            onFileChange={handleFileChange} 
            onProcess={handleProcess} 
            isLoading={isLoading} 
            error={error || undefined} 
          />
        )}

        {reviewData && (
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
        )}
      </div>
    </main>
  );
}
