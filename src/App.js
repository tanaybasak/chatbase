import React, { useState } from 'react';
import './App.scss';
import SplitLayout from './components/SplitLayout';
import DocumentEditor from './components/DocumentEditor';
import ChatPanel from './components/ChatPanel';
import DocumentSidebar from './components/DocumentSidebar';
import { useDocument } from './hooks/useDocument';
import { useSavedDocuments } from './hooks/useSavedDocuments';
import { useChatKitSession } from './hooks/useChatKitSession';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    documentText,
    documentTitle,
    language,
    taskType,
    wordCount,
    isUploading,
    setDocumentText,
    setDocumentTitle,
    setLanguage,
    setTaskType,
    handlePasteText,
    handleFileUpload,
    clearDocument,
    loadDocument,
    currentDocumentId
  } = useDocument();

  const {
    savedDocuments,
    saveDocument,
    deleteDocument,
    updateDocument,
  } = useSavedDocuments();

  const { control } = useChatKitSession();

  // Build document context for legal assistant
  const documentContext = {
    documentText,
    documentTitle,
    language,
    taskType,
    wordCount
  };

  // Handle document upload and auto-save
  const handleUpload = async (file) => {
    const result = await handleFileUpload(file);
    if (result.success && result.documentData) {
      // Auto-save the uploaded document
      await saveDocument(result.documentData);
    }
    return result;
  };

  // Handle new chat - clear current document
  const handleNewChat = () => {
    clearDocument();
  };

  // Handle selecting a saved document
  const handleSelectDocument = (doc) => {
    loadDocument(doc);
  };

  // Handle deleting a document
  const handleDeleteDocument = (docId) => {
    // If deleting the currently open document, clear the editor
    if (docId === currentDocumentId) {
      clearDocument();
    }
    deleteDocument(docId);
  };

  // Handle renaming a document
  const handleRenameDocument = (docId, newTitle) => {
    updateDocument(docId, { title: newTitle });
  };

  // Handle copying a document
  const handleCopyDocument = (docId) => {
    const doc = savedDocuments.find(d => d.id === docId);
    if (doc) {
      const copiedDoc = {
        ...doc,
        title: `${doc.title} (Copy)`,
      };
      saveDocument(copiedDoc);
    }
  };

  return (
    <div className={`app ${isSidebarOpen ? 'app-with-sidebar' : ''}`}>
      <DocumentSidebar
        savedDocuments={savedDocuments}
        onSelectDocument={handleSelectDocument}
        onNewChat={handleNewChat}
        onDeleteDocument={handleDeleteDocument}
        onRenameDocument={handleRenameDocument}
        onCopyDocument={handleCopyDocument}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isOpen={isSidebarOpen}
      />
      <SplitLayout
        leftWidth={60}
        leftPanel={
          <DocumentEditor
            title={documentTitle}
            onTitleChange={setDocumentTitle}
            language={language}
            onLanguageChange={setLanguage}
            taskType={taskType}
            onTaskTypeChange={setTaskType}
            text={documentText}
            onTextChange={setDocumentText}
            wordCount={wordCount}
            onPasteText={handlePasteText}
            onFileUpload={handleUpload}
            isUploading={isUploading}
          />
        }
        rightPanel={
          <ChatPanel control={control} documentContext={documentContext} />
        }
      />
    </div>
  );
}

export default App;

