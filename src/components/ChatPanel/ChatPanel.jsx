import React from 'react';
import { ChatKit } from '@openai/chatkit-react';
import config from '../../config/env';
import './ChatPanel.scss';

const ChatPanel = ({ control, title = "AI Legal Assistant", documentContext }) => {
  const { enableAttachments } = config.features;

  return (
    <div className={`chat-panel ${!enableAttachments ? 'chat-panel--no-attachments' : ''}`}>
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
