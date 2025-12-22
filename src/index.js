import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import ChatOnly from './ChatOnly';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Check if we're in chat-only mode (for iframe embedding)
const isChatOnly = window.location.pathname === '/chat' || 
                   window.location.search.includes('chat-only=true') ||
                   window.CHAT_ONLY_MODE;

root.render(
  <React.StrictMode>
    {isChatOnly ? <ChatOnly /> : <App />}
  </React.StrictMode>
);
