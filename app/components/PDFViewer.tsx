'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface PDFError {
  id: string;
  type: 'mistranslation' | 'omission';
  position: { x: number; y: number; width: number; height: number };
  page: number;
}

interface PDFViewerProps {
  pdfUrl: string;
  title: string;
  errors: PDFError[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  title,
  errors,
  currentPage,
  totalPages,
  onPageChange
}) => {
  const [zoom, setZoom] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentPageErrors = errors.filter(error => error.page === currentPage);

  useEffect(() => {
    // Load PDF.js library dynamically
    const loadPDFJS = async () => {
      try {
        // Load PDF.js from CDN
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = () => {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            loadPDF();
          };
          document.head.appendChild(script);
        } else {
          loadPDF();
        }
      } catch (error) {
        console.error('Error loading PDF.js:', error);
        setPageError('Failed to load PDF library');
        setPageLoading(false);
      }
    };

    const loadPDF = async () => {
      try {
        setPageLoading(true);
        setPageError(null);

        // Check if pdfUrl is a file URL or base64 data
        let pdfData;
        if (pdfUrl.startsWith('data:')) {
          // Handle base64 data URLs
          pdfData = pdfUrl;
        } else if (pdfUrl.startsWith('blob:') || pdfUrl.startsWith('http')) {
          // Handle blob URLs or HTTP URLs
          pdfData = pdfUrl;
        } else {
          // Try to read as file if it's a file path
          try {
            const fileData = await window.fs?.readFile(pdfUrl);
            if (fileData) {
              pdfData = fileData;
            } else {
              throw new Error('File not found');
            }
          } catch {
            // Fallback to treating as URL
            pdfData = pdfUrl;
          }
        }

        const pdf = await window.pdfjsLib.getDocument(pdfData).promise;
        setPdfDoc(pdf);
        setPageLoading(false);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setPageError('Failed to load PDF document');
        setPageLoading(false);
      }
    };

    if (pdfUrl) {
      loadPDFJS();
    }
  }, [pdfUrl]);

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPage();
    }
  }, [pdfDoc, currentPage, zoom]);

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      setPageLoading(true);
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      const viewport = page.getViewport({ scale: zoom });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      setPageLoading(false);
    } catch (error) {
      console.error('Error rendering page:', error);
      setPageError('Failed to render PDF page');
      setPageLoading(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
    link.click();
  };

  // Fallback content when PDF.js is not available or fails
  const renderFallbackContent = () => {
    if (pageError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <p className="text-lg mb-2">Unable to display PDF</p>
          <p className="text-sm">{pageError}</p>
          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download PDF
          </button>
        </div>
      );
    }

    // Mock content as fallback for demonstration
    if (title.includes('English')) {
      return (
        <div className="text-sm text-gray-700 leading-relaxed p-8">
          <p className="mb-4">
            <span className="bg-red-200 px-1 rounded">
              The company's quarterly earnings exceeded expectations
            </span>
            , showing strong growth across all sectors. This performance was driven by 
            increased consumer demand and operational efficiency improvements 
            <span className="bg-yellow-200 px-1 rounded">
              including subsidiary operations
            </span>
            .
          </p>
          <p className="mb-4">
            The board remains optimistic about future prospects despite ongoing 
            <span className="bg-red-200 px-1 rounded">market volatility</span> 
            and economic uncertainties. Strategic investments in technology and 
            expansion into emerging markets have positioned the company for sustained growth.
          </p>
          <p>
            Looking ahead, management expects continued momentum through the remainder 
            of the fiscal year, with particular strength anticipated in the digital 
            services segment.
          </p>
        </div>
      );
    } else {
      return (
        <div className="text-sm text-gray-700 leading-relaxed p-8">
          <p className="mb-4">
            <span className="bg-red-200 px-1 rounded">
              Die vierteljährlichen Einnahmen des Unternehmens übertrafen die Erwartungen
            </span>
            , was ein starkes Wachstum in allen Sektoren zeigt. Diese Leistung wurde durch 
            erhöhte Verbrauchernachfrage und operative Effizienzverbesserungen angetrieben
            <span className="bg-yellow-200 px-1 rounded opacity-50">
              [OMITTED TEXT]
            </span>
            .
          </p>
          <p className="mb-4">
            Der Vorstand bleibt optimistisch über zukünftige Aussichten trotz anhaltender 
            <span className="bg-red-200 px-1 rounded">Marktvolatilität</span> 
            und wirtschaftlicher Unsicherheiten. Strategische Investitionen in Technologie 
            und Expansion in Schwellenmärkte haben das Unternehmen für nachhaltiges Wachstum positioniert.
          </p>
          <p>
            Mit Blick auf die Zukunft erwartet das Management anhaltende Dynamik für den 
            Rest des Geschäftsjahres, mit besonderer Stärke im Bereich digitaler Dienstleistungen.
          </p>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-200 rounded"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-200 rounded"
            disabled={zoom >= 3}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2"></div>
          <button 
            onClick={handleDownload}
            className="p-2 hover:bg-gray-200 rounded"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div 
        ref={containerRef}
        className="relative h-96 overflow-auto bg-gray-50"
      >
        {pageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-10">
            <div className="text-gray-600">Loading PDF...</div>
          </div>
        )}
        
        <div className="p-4 flex justify-center">
          <div className="relative">
            {pdfDoc && !pageError ? (
              <>
                <canvas 
                  ref={canvasRef}
                  className="shadow-lg border border-gray-300"
                />
                
                {/* Error Highlighting Overlays */}
                {currentPageErrors.map((error) => (
                  <div
                    key={error.id}
                    className={`absolute border-2 pointer-events-none ${
                      error.type === 'mistranslation'
                        ? 'bg-red-200 bg-opacity-30 border-red-400'
                        : 'bg-yellow-200 bg-opacity-30 border-yellow-400'
                    }`}
                    style={{
                      left: error.position.x * zoom,
                      top: error.position.y * zoom,
                      width: error.position.width * zoom,
                      height: error.position.height * zoom,
                    }}
                    title={`${error.type === 'mistranslation' ? 'Translation Error' : 'Omission'}: ${error.id}`}
                  />
                ))}
              </>
            ) : (
              <div className="bg-white rounded shadow-sm min-h-80 w-full">
                {renderFallbackContent()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="bg-gray-100 px-4 py-3 border-t flex items-center justify-between">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>
        
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};