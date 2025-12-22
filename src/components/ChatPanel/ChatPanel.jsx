import React, { useEffect } from 'react';
import { ChatKit } from '@openai/chatkit-react';
import { useLegalAssistant } from '../../hooks/useLegalAssistant';
import './ChatPanel.scss';

const ChatPanel = ({ control, title = "AI Legal Assistant", documentContext }) => {
  const { 
    isReady, 
    embeddingsReady, 
    loadingStatus, 
    stats 
  } = useLegalAssistant(documentContext);

  // Log when legal rules are ready
  useEffect(() => {
    if (isReady) {
      const embeddingStatus = embeddingsReady ? 'with vector search' : '(generating embeddings)';
      console.log(`✅ Legal assistant ready with ${stats.total} rules ${embeddingStatus}`);
    }
  }, [isReady, embeddingsReady, stats]);

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <h1 className="chat-panel__title">{title}</h1>
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
