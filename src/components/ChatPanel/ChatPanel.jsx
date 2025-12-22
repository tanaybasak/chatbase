import React, { useEffect } from 'react';
import { ChatKit } from '@openai/chatkit-react';
import { useLegalAssistant } from '../../hooks/useLegalAssistant';
import './ChatPanel.scss';

const ChatPanel = ({ control, title = "AI Legal Assistant", documentContext }) => {
  const { 
    isReady, 
    embeddingsReady, 
    loadingStatus, 
    buildSystemMessage, 
    stats 
  } = useLegalAssistant(documentContext);

  // Log when legal rules are ready
  useEffect(() => {
    if (isReady) {
      const embeddingStatus = embeddingsReady ? 'with vector search' : '(generating embeddings)';
      console.log(`✅ Legal assistant ready with ${stats.total} rules ${embeddingStatus}`);
    }
  }, [isReady, embeddingsReady, stats]);

  const getStatusIcon = () => {
    if (!isReady) return '⏳';
    if (!embeddingsReady) return '🔄';
    return '✓';
  };

  const getStatusText = () => {
    if (!isReady) return loadingStatus;
    if (!embeddingsReady) return `${stats.total} rules (building search index...)`;
    return `${stats.total} legal rules • Vector search ready`;
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <h1 className="chat-panel__title">{title}</h1>
        <div className="chat-panel__status">
          <span className={`status-indicator ${isReady ? 'active' : ''}`}>
            {getStatusIcon()}
          </span>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>
      <div className="chat-panel__container">
        <ChatKit 
          control={control} 
          className="chat-panel__widget"
        />
      </div>
    </div>
  );
};

export default React.memo(ChatPanel);
