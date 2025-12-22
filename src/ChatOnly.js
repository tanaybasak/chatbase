import React from 'react';
import './ChatOnly.scss';
import ChatPanel from './components/ChatPanel';
import { useChatKitSession } from './hooks/useChatKitSession';

function ChatOnly() {
  const { control } = useChatKitSession();

  return (
    <div className="chat-only">
      <ChatPanel control={control} />
    </div>
  );
}

export default ChatOnly;
