import React from 'react';
import './DocumentSidebar.scss';

const DocumentSidebar = ({ 
  savedDocuments, 
  onSelectDocument, 
  onNewChat, 
  onToggleSidebar,
  isOpen 
}) => {
  return (
    <div className={`document-sidebar ${isOpen ? 'document-sidebar--open' : ''}`}>
      <div className="document-sidebar__header">
        <button 
          className="document-sidebar__toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isOpen ? (
              <path d="M15 18l-6-6 6-6" />
            ) : (
              <path d="M9 18l6-6-6-6" />
            )}
          </svg>
        </button>
      </div>

      <div className="document-sidebar__actions">
        <button 
          className="document-sidebar__action-btn"
          onClick={onNewChat}
          aria-label="New chat"
          title="New chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {isOpen && <span>New Chat</span>}
        </button>

        <button 
          className="document-sidebar__action-btn"
          aria-label="Saved documents"
          title="Saved documents"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          {isOpen && <span>Documents ({savedDocuments.length})</span>}
        </button>
      </div>

      {isOpen && (
        <div className="document-sidebar__list">
          <h3 className="document-sidebar__list-title">Saved Documents</h3>
          {savedDocuments.length === 0 ? (
            <p className="document-sidebar__empty">No saved documents yet</p>
          ) : (
            <div className="document-sidebar__items">
              {savedDocuments.map((doc) => (
                <div 
                  key={doc.id} 
                  className="document-sidebar__item"
                  onClick={() => onSelectDocument(doc)}
                >
                  <div className="document-sidebar__item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                  </div>
                  <div className="document-sidebar__item-content">
                    <div className="document-sidebar__item-title">{doc.title}</div>
                    <div className="document-sidebar__item-meta">
                      {doc.wordCount} words · {new Date(doc.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(DocumentSidebar);
