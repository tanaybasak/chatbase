import React, { useRef } from 'react';
import './DocumentUpload.scss';

const DocumentUpload = ({ onPasteText, onFileUpload }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="document-upload">
      <p className="document-upload__prompt">Add text or upload doc</p>
      <div className="document-upload__buttons">
        <button 
          className="document-upload__btn document-upload__btn--paste" 
          onClick={onPasteText}
          aria-label="Paste text from clipboard"
        >
          <svg className="document-upload__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          Paste text
        </button>
        <button 
          className="document-upload__btn document-upload__btn--upload"
          onClick={handleUploadClick}
          aria-label="Upload document"
        >
          <svg className="document-upload__icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Upload document
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".txt,.doc,.docx,.pdf" 
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};

export default React.memo(DocumentUpload);
