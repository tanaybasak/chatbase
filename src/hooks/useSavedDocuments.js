import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing saved documents with database backend
 * @returns {Object} Saved documents state and handlers
 */
export const useSavedDocuments = () => {
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get device ID (same as ChatKit)
  const getDeviceId = useCallback(() => {
    const storageKey = 'chatkit_device_id';
    let deviceId = localStorage.getItem(storageKey);
    
    if (!deviceId) {
      deviceId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, deviceId);
    }
    
    return deviceId;
  }, []);

  const deviceId = getDeviceId();
  const apiUrl = '/.netlify/functions/documents';

  // Load documents from database
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}?deviceId=${deviceId}`);
      if (response.ok) {
        const documents = await response.json();
        setSavedDocuments(documents);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Save document
  const saveDocument = useCallback(async (document) => {
    try {
      const response = await fetch(`${apiUrl}?deviceId=${deviceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.title || 'Untitled Document',
          content: document.content,
          language: document.language,
          taskType: document.taskType,
          wordCount: document.wordCount,
        })
      });

      if (response.ok) {
        const newDoc = await response.json();
        setSavedDocuments((prev) => [newDoc, ...prev]);
        return newDoc;
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  }, [deviceId]);

  // Update existing document
  const updateDocument = useCallback(async (id, updates) => {
    try {
      const response = await fetch(`${apiUrl}?deviceId=${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });

      if (response.ok) {
        const updatedDoc = await response.json();
        setSavedDocuments((prev) =>
          prev.map((doc) => (doc.id === id ? updatedDoc : doc))
        );
      }
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  }, [deviceId]);

  // Delete document
  const deleteDocument = useCallback(async (id) => {
    try {
      const response = await fetch(`${apiUrl}?deviceId=${deviceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        setSavedDocuments((prev) => prev.filter((doc) => doc.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  }, [deviceId]);

  // Get document by ID
  const getDocument = useCallback((id) => {
    return savedDocuments.find((doc) => doc.id === id);
  }, [savedDocuments]);

  return {
    savedDocuments,
    isLoading,
    saveDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    loadDocuments,
  };
};
    updateDocument,
    deleteDocument,
    getDocument,
    clearAllDocuments,
  };
};
