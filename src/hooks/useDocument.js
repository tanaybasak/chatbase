import { useState, useCallback } from 'react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use local worker from public folder
pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

/**
 * Custom hook for managing document state and operations
 * @returns {Object} Document state and handlers
 */
export const useDocument = () => {
  const [documentText, setDocumentText] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [language, setLanguage] = useState('English (US)');
  const [taskType, setTaskType] = useState('Enter writing task');
  const [isUploading, setIsUploading] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState(null);

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

  // Parse PDF file
  const parsePDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    return fullText;
  };

  // Parse DOCX file
  const parseDOCX = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value; // Returns HTML
  };

  // Parse TXT file
  const parseTXT = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  };

  // Handle file upload with document parsing
  const handleFileUpload = useCallback(async (file) => {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    setIsUploading(true);

    try {
      let content = '';
      const fileName = file.name.toLowerCase();

      // Set document title from filename
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ''));

      // Parse based on file type
      if (fileName.endsWith('.pdf')) {
        content = await parsePDF(file);
        // Convert plain text to HTML for TinyMCE
        content = `<p>${content.split('\n').filter(line => line.trim()).join('</p><p>')}</p>`;
      } else if (fileName.endsWith('.docx')) {
        content = await parseDOCX(file);
      } else if (fileName.endsWith('.txt')) {
        const text = await parseTXT(file);
        // Convert plain text to HTML
        content = `<p>${text.split('\n').filter(line => line.trim()).join('</p><p>')}</p>`;
      } else if (fileName.endsWith('.doc')) {
        // For .doc files, try to read as text (limited support)
        const text = await parseTXT(file);
        content = `<p>${text.split('\n').filter(line => line.trim()).join('</p><p>')}</p>`;
      } else {
        throw new Error('Unsupported file type. Please upload PDF, DOCX, DOC, or TXT files.');
      }

      setDocumentText(content);
      setIsUploading(false);
      
      // Return the document data for immediate use
      const title = file.name.replace(/\.[^/.]+$/, '');
      return { 
        success: true, 
        content,
        documentData: {
          title: title,
          content,
          language,
          taskType,
          wordCount: content.replace(/<[^>]*>/g, '').trim().split(/\s+/).length,
        }
      };
    } catch (err) {
      console.error('Failed to parse document:', err);
      setIsUploading(false);
      return { success: false, error: err.message };
    }
  }, [language, taskType]);

  // Clear document
  const clearDocument = useCallback(() => {
    setDocumentText('');
    setDocumentTitle('');
    setCurrentDocumentId(null);
  }, []);

  // Update text
  const updateText = useCallback((text) => {
    setDocumentText(text);
  }, []);

  // Load a saved document
  const loadDocument = useCallback((doc) => {
    setDocumentText(doc.content);
    setDocumentTitle(doc.title);
    setLanguage(doc.language);
    setTaskType(doc.taskType);
    setCurrentDocumentId(doc.id);
  }, []);

  // Get current document data
  const getCurrentDocument = useCallback(() => {
    return {
      id: currentDocumentId,
      title: documentTitle,
      content: documentText,
      language,
      taskType,
      wordCount,
    };
  }, [currentDocumentId, documentTitle, documentText, language, taskType, wordCount]);

  return {
    // State
    documentText,
    documentTitle,
    language,
    taskType,
    wordCount,
    isUploading,
    currentDocumentId,
    
    // Setters
    setDocumentText: updateText,
    setDocumentTitle,
    setLanguage,
    setTaskType,
    
    // Actions
    handlePasteText,
    handleFileUpload,
    clearDocument,
    loadDocument,
    getCurrentDocument
  };
};
