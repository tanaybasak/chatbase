import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing saved documents
 * @returns {Object} Saved documents state and handlers
 */
export const useSavedDocuments = () => {
  const STORAGE_KEY = 'chatbase_saved_documents';
  const [savedDocuments, setSavedDocuments] = useState([]);

  // Load saved documents from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedDocuments(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load saved documents:', err);
    }
  }, []);

  // Save document
  const saveDocument = useCallback((document) => {
    const newDoc = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: document.title || 'Untitled Document',
      content: document.content,
      language: document.language,
      taskType: document.taskType,
      wordCount: document.wordCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedDocuments((prev) => {
      const updated = [newDoc, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    return newDoc;
  }, []);

  // Update existing document
  const updateDocument = useCallback((id, updates) => {
    setSavedDocuments((prev) => {
      const updated = prev.map((doc) =>
        doc.id === id
          ? { ...doc, ...updates, updatedAt: new Date().toISOString() }
          : doc
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Delete document
  const deleteDocument = useCallback((id) => {
    setSavedDocuments((prev) => {
      const updated = prev.filter((doc) => doc.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Get document by ID
  const getDocument = useCallback((id) => {
    return savedDocuments.find((doc) => doc.id === id);
  }, [savedDocuments]);

  // Clear all documents
  const clearAllDocuments = useCallback(() => {
    setSavedDocuments([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    savedDocuments,
    saveDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    clearAllDocuments,
  };
};
