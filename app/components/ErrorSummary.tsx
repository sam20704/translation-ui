'use client';

import React from 'react';

interface ErrorSummaryProps {
  errors: Array<{
    id: string;
    type: 'mistranslation' | 'omission';
    originalText: string;
    translatedText: string;
    suggestion: string;
    confidence: number;
    page: number;
  }>;
  onErrorClick: (errorId: string) => void;
}

export const ErrorSummary: React.FC<ErrorSummaryProps> = ({ errors, onErrorClick }) => {
  const mistranslations = errors.filter(e => e.type === 'mistranslation');
  const omissions = errors.filter(e => e.type === 'omission');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Translation Analysis Summary
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>{mistranslations.length} Mistranslations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span>{omissions.length} Omissions</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {errors.map((error) => (
          <div
            key={error.id}
            onClick={() => onErrorClick(error.id)}
            className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
              error.type === 'mistranslation'
                ? 'border-red-400 bg-red-50 hover:bg-red-100'
                : 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    error.type === 'mistranslation'
                      ? 'bg-red-200 text-red-800'
                      : 'bg-yellow-200 text-yellow-800'
                  }`}
                >
                  {error.type === 'mistranslation' ? 'Mistranslation' : 'Omission'}
                </span>
                <span className="text-sm text-gray-500">Page {error.page}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  error.confidence > 0.8 ? 'bg-red-500' : 
                  error.confidence > 0.6 ? 'bg-yellow-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-xs text-gray-500">
                  {Math.round(error.confidence * 100)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Original:</span>
                <p className="text-sm text-gray-600 italic">"{error.originalText}"</p>
              </div>
              
              {error.translatedText && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Translation:</span>
                  <p className="text-sm text-gray-600 italic">"{error.translatedText}"</p>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium text-gray-700">Suggestion:</span>
                <p className="text-sm text-gray-800">{error.suggestion}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};