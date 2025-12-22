import { useState, useCallback } from 'react';

/**
 * Custom hook for managing document state and operations
 * @returns {Object} Document state and handlers
 */
export const useDocument = () => {
  const [documentText, setDocumentText] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [language, setLanguage] = useState('English (US)');
  const [taskType, setTaskType] = useState('Enter writing task');

  // Calculate word count - strips HTML tags for accurate count
  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  const wordCount = stripHtml(documentText)
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  // Handle paste from clipboard
  const handlePasteText = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setDocumentText(text);
      return { success: true, text };
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target.result;
        setDocumentText(text);
        resolve({ success: true, text });
      };

      reader.onerror = (e) => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }, []);

  // Clear document
  const clearDocument = useCallback(() => {
    setDocumentText('');
    setDocumentTitle('');
  }, []);

  // Update text
  const updateText = useCallback((text) => {
    setDocumentText(text);
  }, []);

  return {
    // State
    documentText,
    documentTitle,
    language,
    taskType,
    wordCount,
    
    // Setters
    setDocumentText: updateText,
    setDocumentTitle,
    setLanguage,
    setTaskType,
    
    // Actions
    handlePasteText,
    handleFileUpload,
    clearDocument
  };
};
