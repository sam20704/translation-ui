// app/components/PdfViewerLayout.tsx
import { useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import type { Plugin } from '@react-pdf-viewer/core';

interface PdfViewerLayoutProps {
  originalPdfUrl: string;
  translatedPdfUrl: string;
  highlightMessage: string;
  defaultLayoutPlugin: Plugin;
  searchPlugin: Plugin;
}

export function PdfViewerLayout({ originalPdfUrl, translatedPdfUrl, highlightMessage, defaultLayoutPlugin, searchPlugin }: PdfViewerLayoutProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'translated'>('original');

  return (
    <section className="w-full">
      <div className="md:hidden flex border-b mb-4 bg-white rounded-t-lg shadow-lg">
        <button onClick={() => setActiveTab('original')} className={`flex-1 p-3 font-semibold ${activeTab === 'original' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Original</button>
        <button onClick={() => setActiveTab('translated')} className={`flex-1 p-3 font-semibold ${activeTab === 'translated' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Translated</button>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 h-[85vh] bg-white p-4 md:rounded-lg shadow-lg">
        <div className={`${activeTab === 'original' ? 'block' : 'hidden'} md:block border rounded-lg overflow-hidden flex flex-col`}>
          <h2 className="text-center font-bold p-2 bg-gray-50 border-b">Original Document</h2>
          <div className="flex-grow">
            {originalPdfUrl && (
              <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
                <Viewer fileUrl={originalPdfUrl} plugins={[defaultLayoutPlugin]} />
              </Worker>
            )}
          </div>
        </div>
        <div className={`${activeTab === 'translated' ? 'block' : 'hidden'} md:block border rounded-lg overflow-hidden flex flex-col`}>
          <h2 className="text-center font-bold p-2 bg-gray-50 border-b">Translated Document</h2>
          {highlightMessage && <p className="text-center p-2 text-sm text-yellow-800 bg-yellow-100">{highlightMessage}</p>}
          <div className="flex-grow">
            <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`}>
              <Viewer fileUrl={translatedPdfUrl} plugins={[defaultLayoutPlugin, searchPlugin]} />
            </Worker>
          </div>
        </div>
      </div>
    </section>
  );
}