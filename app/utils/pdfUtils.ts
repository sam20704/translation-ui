export interface TranslationError {
  id: string;
  type: 'mistranslation' | 'omission';
  originalText: string;
  translatedText: string;
  page: number;
  position: { x: number; y: number; width: number; height: number };
  suggestion: string;
  confidence: number;
}

export const processTranslationResults = (
  originalText: string,
  translatedText: string,
  analysisResult: any
): TranslationError[] => {
  return analysisResult.errors.map((error: any, index: number) => ({
    id: `error_${index}`,
    type: error.type,
    originalText: error.originalText,
    translatedText: error.translatedText || '',
    page: error.page || 1,
    position: error.position || { x: 50, y: 100 + index * 30, width: 200, height: 20 },
    suggestion: error.suggestion,
    confidence: error.confidence || 0.8
  }));
};

export const highlightTextInPDF = (
  pdfElement: HTMLElement,
  errors: TranslationError[],
  currentPage: number
) => {
  // Clear existing highlights
  const existingHighlights = pdfElement.querySelectorAll('.pdf-highlight');
  existingHighlights.forEach(highlight => highlight.remove());

  // Add new highlights for current page
  const pageErrors = errors.filter(error => error.page === currentPage);
  
  pageErrors.forEach(error => {
    const highlight = document.createElement('div');
    highlight.className = `pdf-highlight absolute pointer-events-none ${
      error.type === 'mistranslation' ? 'highlight-mistranslation' : 'highlight-omission'
    }`;
    highlight.style.left = `${error.position.x}px`;
    highlight.style.top = `${error.position.y}px`;
    highlight.style.width = `${error.position.width}px`;
    highlight.style.height = `${error.position.height}px`;
    
    pdfElement.appendChild(highlight);
  });
};