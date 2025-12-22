import React, { useState } from 'react';
import './App.scss';
import { ChatKit, useChatKit } from '@openai/chatkit-react';

function App() {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  const [documentText, setDocumentText] = useState('');
  const [language, setLanguage] = useState('English (US)');
  const [taskType, setTaskType] = useState('Enter writing task');
  
  const { control } = useChatKit({
    api: {
      async getClientSecret(existing) {
        if (existing) {
          return existing;
        }
        
        try {
          const res = await fetch(`${backendUrl}/api/chatkit/session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceId: localStorage.getItem('deviceId') || `user-${Date.now()}`
            })
          });

          if (!res.ok) {
            throw new Error('Failed to get client secret');
          }

          const { client_secret } = await res.json();
          return client_secret;
        } catch (error) {
          console.error('Error getting client secret:', error);
          throw error;
        }
      }
    },
    composer: {
      attachments: {
        enabled: true
      }
    }
  });

  const handlePasteText = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setDocumentText(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentText(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="app">
      <div className="split-container">
        {/* Left Side - Document Editor (60%) */}
        <div className="document-panel">
          <div className="document-header">
            <input 
              type="text" 
              className="document-title" 
              placeholder="Untitled document"
            />
            <div className="document-controls">
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="control-select"
              >
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Hindi</option>
              </select>
              <select 
                value={taskType} 
                onChange={(e) => setTaskType(e.target.value)}
                className="control-select"
              >
                <option>Enter writing task</option>
                <option>Legal Brief</option>
                <option>Contract Draft</option>
                <option>Legal Memo</option>
              </select>
            </div>
          </div>

          <div className="document-upload-area">
            <p className="upload-prompt">Add text or upload doc</p>
            <div className="upload-buttons">
              <button className="btn-upload" onClick={handlePasteText}>
                📋 Paste text
              </button>
              <label className="btn-upload">
                ☁️ Upload document
                <input 
                  type="file" 
                  accept=".txt,.doc,.docx,.pdf" 
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className="document-editor">
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Start typing or paste your document here..."
              className="editor-textarea"
            />
          </div>

          <div className="document-footer">
            <div className="word-count">{documentText.split(/\s+/).filter(w => w).length} words</div>
          </div>
        </div>

        {/* Right Side - Chat (40%) */}
        <div className="chat-panel">
          <h1 className="chat-title">AI Legal Assistant</h1>
          <div className="chatkit-container">
            <ChatKit 
              control={control} 
              className="chatkit-widget"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

