// app/components/PdfViewerLayout.tsx
import React from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import type { Plugin } from '@react-pdf-viewer/core';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';

interface PdfViewerLayoutProps {
  title: string;
  fileUrl: string;
  pluginInstances: Plugin[];
  highlightMessage?: string;
}

/**
 * Generic PDF viewer layout for use in grid views (side-by-side).
 * Shows a header, empty message, file preview, and (optionally) highlight info.
 */
export function PdfViewerLayout({
  title,
  fileUrl,
  pluginInstances,
  highlightMessage,
}: PdfViewerLayoutProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white flex flex-col h-full min-h-[400px]">
      <h2 className="text-center font-bold p-2 bg-gray-50 border-b">{title}</h2>
      {highlightMessage && (
        <div className="text-center p-2 text-sm text-yellow-800 bg-yellow-100 border-b">
          {highlightMessage}
        </div>
      )}
      <div className="flex-grow h-0">
        {fileUrl ? (
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer fileUrl={fileUrl} plugins={pluginInstances} />
          </Worker>
        ) : (
          <div className="h-full flex justify-center items-center text-gray-400 text-sm">
            No PDF loaded.
          </div>
        )}
      </div>
    </div>
  );
}