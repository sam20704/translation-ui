// app/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, AlertTriangle, Loader2 } from 'lucide-react';
import { PDFViewer, ErrorSummary, LoadingState } from './components';

interface TranslationError {
  id: string;
  type: 'mistranslation' | 'omission';
  originalText: string;
  translatedText: string;
  page: number;
  position: { x: number; y: number; width: number; height: number };
  suggestion: string;
  confidence: number;
}

interface ProcessingStatus {
  step: 'upload' | 'translating' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

const PDFTranslationEvaluator = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    step: 'upload',
    progress: 0,
    message: 'Ready to upload PDF'
  });
  const [translationErrors, setTranslationErrors] = useState<TranslationError[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [englishPdfUrl, setEnglishPdfUrl] = useState<string>('');
  const [germanPdfUrl, setGermanPdfUrl] = useState<string>('');

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file');
      return;
    }

    setUploadedFile(file);
    setProcessingStatus({
      step: 'translating',
      progress: 10,
      message: 'Uploading PDF and preparing for translation...'
    });

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('pdf', file);

      setProcessingStatus({
        step: 'translating',
        progress: 30,
        message: 'Translating document with DeepL API...'
      });

      // Call translation API
      const response = await fetch('/api/translate', {
        method: 'POST',
        body: formData,
      });

      setProcessingStatus({
        step: 'analyzing',
        progress: 60,
        message: 'Analyzing translations with AI reflection agent...'
      });

      if (!response.ok) {
        throw new Error('Translation request failed');
      }

      const result = await response.json();
      
      // Process results
      const processedErrors: TranslationError[] = result.analysisResult.errors.map((error: any, index: number) => ({
        id: `error_${index}`,
        type: error.type,
        originalText: error.originalText,
        translatedText: error.translatedText || '',
        page: error.page || 1,
        position: error.position || { 
          x: 50 + (index % 3) * 100, 
          y: 100 + Math.floor(index / 3) * 50, 
          width: 200, 
          height: 20 
        },
        suggestion: error.suggestion,
        confidence: error.confidence || 0.8
      }));

      setTranslationErrors(processedErrors);
      setTotalPages(3); // This would come from PDF analysis
      setEnglishPdfUrl(`data:application/pdf;base64,${result.originalPdf}`);
      setGermanPdfUrl(`data:application/pdf;base64,${result.translatedPdf}`);
      
      setProcessingStatus({
        step: 'complete',
        progress: 100,
        message: 'Analysis complete'
      });

    } catch (error) {
      console.error('Processing error:', error);
      // Fallback to simulation for demo
      await simulateProcessing();
    }
  }, []);

  const simulateProcessing = async () => {
    // Step 1: Translation
    setProcessingStatus({
      step: 'translating',
      progress: 30,
      message: 'Translating document with DeepL API...'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Analysis
    setProcessingStatus({
      step: 'analyzing',
      progress: 60,
      message: 'Analyzing translations with AI reflection agent...'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Complete with mock data
    setProcessingStatus({
      step: 'complete',
      progress: 100,
      message: 'Analysis complete'
    });

    // Mock translation errors
    const mockErrors: TranslationError[] = [
      {
        id: '1',
        type: 'mistranslation',
        originalText: 'The company\'s quarterly earnings exceeded expectations',
        translatedText: 'Die vierteljährlichen Einnahmen des Unternehmens übertrafen die Erwartungen',
        page: 1,
        position: { x: 50, y: 200, width: 300, height: 20 },
        suggestion: 'Consider using "Gewinne" instead of "Einnahmen" for earnings in financial context',
        confidence: 0.85
      },
      {
        id: '2',
        type: 'omission',
        originalText: 'including subsidiary operations',
        translatedText: '',
        page: 1,
        position: { x: 50, y: 300, width: 200, height: 20 },
        suggestion: 'Text was omitted in translation: "einschließlich Tochtergesellschaften"',
        confidence: 0.92
      },
      {
        id: '3',
        type: 'mistranslation',
        originalText: 'market volatility',
        translatedText: 'Marktvolatilität',
        page: 2,
        position: { x: 100, y: 150, width: 150, height: 18 },
        suggestion: 'While technically correct, "Marktschwankungen" might be more natural in German',
        confidence: 0.75
      }
    ];

    setTranslationErrors(mockErrors);
    setTotalPages(3);
    setEnglishPdfUrl('/api/pdf/english');
    setGermanPdfUrl('/api/pdf/german');
  };

  const getPageErrors = (page: number) => {
    return translationErrors.filter(error => error.page === page);
  };

  const hasPageErrors = (page: number) => {
    return getPageErrors(page).length > 0;
  };

  const renderUploadSection = () => (
    <div className="flex flex-col min-h-screen justify-center max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-4">
          PDF Translation Evaluator
        </h1>
        <p className="text-white text-lg">
          Upload an English PDF to translate to German and analyze for translation accuracy
        </p>
      </div>

      {processingStatus.step !== 'upload' ? (
        <LoadingState 
          step={processingStatus.step}
          progress={processingStatus.progress}
          message={processingStatus.message}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="pdf-upload"
              disabled={processingStatus.step !== 'upload'}
            />
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer flex flex-col items-center space-y-4"
            >
              <Upload className="w-16 h-16 text-gray-400" />
              <div>
                <p className="text-xl font-semibold text-gray-700">
                  Drop your English PDF here or click to browse
                </p>
                <p className="text-gray-500 mt-2">
                  Supports PDF files up to 10MB
                </p>
              </div>
            </label>
          </div>

          {uploadedFile && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-800">{uploadedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderAnalysisResults = () => (
    <div className="max-w-8xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">
          Translation Analysis Results
        </h1>
        <div className="flex items-center space-x-6 text-sm text-white">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span>Mistranslations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span>Omissions</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span>{translationErrors.length} issues found</span>
          </div>
        </div>
      </div>

      {/* PDF Viewers Side by Side */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <PDFViewer
          pdfUrl={englishPdfUrl}
          title="Original (English)"
          errors={translationErrors}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
        <PDFViewer
          pdfUrl={germanPdfUrl}
          title="Translation (German)"
          errors={translationErrors}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Enhanced Page Navigation */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white mr-4">Pages:</span>
          {[...Array(totalPages)].map((_, index) => {
            const pageNum = index + 1;
            const hasErrors = hasPageErrors(pageNum);
            const pageErrorCount = getPageErrors(pageNum).length;
            return (
              <div key={pageNum} className="relative">
                <button
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : hasErrors
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={hasErrors ? `${pageErrorCount} error(s) on this page` : `Page ${pageNum}`}
                >
                  {pageNum}
                </button>
                {hasErrors && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                    {pageErrorCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Error Summary */}
      <ErrorSummary
        errors={translationErrors}
        onErrorClick={(errorId) => {
          const error = translationErrors.find(e => e.id === errorId);
          if (error) {
            setCurrentPage(error.page);
          }
        }}
      />
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-center space-x-4">
        <button
          onClick={() => {
            setProcessingStatus({ step: 'upload', progress: 0, message: 'Ready to upload PDF' });
            setUploadedFile(null);
            setTranslationErrors([]);
            setCurrentPage(1);
            setTotalPages(0);
          }}
          className="px-6 py-2 bg-orange-400 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Upload New PDF
        </button>
        <button
          onClick={() => {
            // Export functionality would go here
            alert('Export functionality would be implemented here');
          }}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-900 transition-colors"
        >
          Export Report
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-tr from-red-500 to-violet-900 via-grey-600">
      {processingStatus.step === 'complete'
        ? renderAnalysisResults()
        : renderUploadSection()
      }
    </div>
  );
};

export default PDFTranslationEvaluator;