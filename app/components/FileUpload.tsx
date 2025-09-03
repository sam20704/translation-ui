import React from 'react';

// More generic props for reusable multi-file upload controls
interface FileUploadProps {
  label: string;
  file: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  disabled?: boolean;
}

// Now this component is just for a file input+label. "Process" button is handled at page level.
export function FileUpload({
  label,
  file,
  onFileChange,
  accept = '.pdf',
  disabled = false,
}: FileUploadProps) {
  return (
    <div className="w-full max-w-xs mx-auto p-4 bg-white rounded-lg shadow">
      <label
        className="block text-md font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <input
        type="file"
        accept={accept}
        onChange={onFileChange}
        disabled={disabled}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
          file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {file && (
        <div className="mt-1 text-xs text-gray-500 break-all">Selected: {file.name}</div>
      )}
    </div>
  );
}