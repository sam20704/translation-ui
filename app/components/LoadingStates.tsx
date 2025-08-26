'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  step: 'upload' | 'translating' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ step, progress, message }) => {
  const steps = [
    { key: 'upload', label: 'Upload PDF', icon: '📄' },
    { key: 'translating', label: 'Translate with DeepL', icon: '🔄' },
    { key: 'analyzing', label: 'Analyze with AI', icon: '🔍' },
    { key: 'complete', label: 'Complete', icon: '✅' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Processing PDF</h2>
        <p className="text-gray-600">{message}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
        <div
          className="bg-blue-500 h-3 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center">
        {steps.map((stepItem, index) => (
          <div key={stepItem.key} className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg mb-2 transition-colors ${
                index < currentStepIndex
                  ? 'bg-green-500 text-white'
                  : index === currentStepIndex
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {stepItem.icon}
            </div>
            <span
              className={`text-sm font-medium ${
                index <= currentStepIndex ? 'text-gray-800' : 'text-gray-500'
              }`}
            >
              {stepItem.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};