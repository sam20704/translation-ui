// app/components/FileUpload.tsx
import React from 'react';

interface FileUploadProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcess: () => void;
  isLoading: boolean;
  disabled: boolean;
  errorMessage: string | null;
}

export function FileUpload({ onFileChange, onProcess, isLoading, disabled, errorMessage }: FileUploadProps) {
  return (
    <section className="w-full max-w-2xl mx-auto mb-8 p-6 bg-white rounded-lg shadow-lg">
      <label htmlFor="file-upload" className="block text-lg font-medium text-gray-700 mb-2">
        1. Upload Original PDF
      </label>
      <input id="file-upload" type="file" accept=".pdf" onChange={onFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
      <button onClick={onProcess} disabled={disabled || isLoading} className="mt-4 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-all duration-300 flex items-center justify-center">
        {isLoading ? (
          <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</>
        ) : '2. Translate and Review'}
      </button>
      {errorMessage && <p className="mt-4 text-center text-red-600 bg-red-100 p-2 rounded-md">{errorMessage}</p>}
    </section>
  );
}