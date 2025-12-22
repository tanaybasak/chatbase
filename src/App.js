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
    getCurrentDocument
  } = useDocument();

  const {
    savedDocuments,
    saveDocument,
    deleteDocument,
  } = useSavedDocuments();

  const { control } = useChatKitSession();

  // Handle document upload and auto-save
  const handleUpload = async (file) => {
    const result = await handleFileUpload(file);
    if (result.success) {
      // Auto-save the uploaded document
      const currentDoc = getCurrentDocument();
      saveDocument(currentDoc);
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

  return (
    <div className={`app ${isSidebarOpen ? 'app-with-sidebar' : ''}`}>
      <DocumentSidebar
        savedDocuments={savedDocuments}
        onSelectDocument={handleSelectDocument}
        onNewChat={handleNewChat}
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
          <ChatPanel control={control} />
        }
      />
    </div>
  );
}

export default App;

