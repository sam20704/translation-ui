'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import type { Plugin } from '@react-pdf-viewer/core';

import { usePdfReview } from '../hooks/usePdfReview';

import { FileUpload } from './components/FileUpload';
import { PdfViewerLayout } from './components/PdfViewerLayout';
import { SuggestionsTable } from './components/SuggestionsTable';

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
    const applyHighlights = async () => {
      try {
        if (reviewData?.phrasesToHighlight && reviewData.phrasesToHighlight.length > 0) {
          const matches = await highlight(
            reviewData.phrasesToHighlight.map(phrase => ({
              keyword: phrase,
              matchCase: true,
            }))
          );
          
          if (matches.length === 0) {
            setHighlightMessage('Note: No matching phrases found in PDF for highlighting.');
          } else {
            setHighlightMessage(`Highlighted ${matches.length} phrase(s) in the document.`);
          }
        } else {
          clearHighlights();
          setHighlightMessage('');
        }
      } catch (error) {
        console.error('Error applying highlights:', error);
        setHighlightMessage('Error occurred while highlighting phrases.');
      }
    };

    applyHighlights();
  }, [reviewData, highlight, clearHighlights]);

  // Create URL object from uploaded file
  useEffect(() => {
    if (!originalPdfFile) {
      setOriginalPdfUrl('');
      return;
    }
    
    const url = URL.createObjectURL(originalPdfFile);
    setOriginalPdfUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [originalPdfFile]);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file.');
        e.target.value = ''; // Reset input
        return;
      }
      
      // Validate file size (e.g., max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size exceeds 10MB limit. Please select a smaller file.');
        e.target.value = ''; // Reset input
        return;
      }
      
      setOriginalPdfFile(file);
      reset();
      clearHighlights();
      setHighlightMessage('');
    }
  }, [reset, clearHighlights]);

  // Trigger backend processing
  const handleProcess = useCallback(() => {
    if (originalPdfFile) {
      process(originalPdfFile);
    }
  }, [originalPdfFile, process]);

  // Reset everything
  const handleReset = useCallback(() => {
    setOriginalPdfFile(null);
    setOriginalPdfUrl('');
    setHighlightMessage('');
    clearHighlights();
    reset();
  }, [reset, clearHighlights]);

  return (
    <main className='flex flex-col items-center min-h-screen p-4 md:p-8 bg-gray-100'>
      <div className='w-full max-w-7xl'>
        <header className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900'>
            PDF Translation Reviewer
          </h1>
          <p className='text-gray-700 mt-2'>
            Upload your PDF and review translation errors highlighted in the document.
          </p>
        </header>

        {!reviewData ? (
          <FileUpload 
            disabled={!originalPdfFile || isLoading}
            onFileChange={handleFileChange} 
            onProcess={handleProcess} 
            isLoading={isLoading} 
            errorMessage={error}
          />
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Start New Review
              </button>
            </div>

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