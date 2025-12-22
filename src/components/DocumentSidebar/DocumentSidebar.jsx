import React, { useState, useEffect, useRef } from 'react';
import './DocumentSidebar.scss';

const DocumentSidebar = ({ 
  savedDocuments, 
  onSelectDocument, 
  onNewChat, 
  onToggleSidebar,
  onDeleteDocument,
  onRenameDocument,
  onCopyDocument,
  isOpen 
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

  const handleMenuToggle = (docId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === docId ? null : docId);
  };

  const handleDelete = (docId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      onDeleteDocument(docId);
    }
    setOpenMenuId(null);
  };

  const handleRename = (doc, e) => {
    e.stopPropagation();
    setRenamingId(doc.id);
    setRenameValue(doc.title);
    setOpenMenuId(null);
  };

  const handleRenameSubmit = (docId, e) => {
    e.stopPropagation();
    if (renameValue.trim()) {
      onRenameDocument(docId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameCancel = (e) => {
    e.stopPropagation();
    setRenamingId(null);
    setRenameValue('');
  };

  const handleCopy = (docId, e) => {
    e.stopPropagation();
    onCopyDocument(docId);
    setOpenMenuId(null);
  };
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
          onClick={() => !isOpen && onToggleSidebar()}
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
                    {renamingId === doc.id ? (
                      <div className="document-sidebar__rename-form" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(doc.id, e);
                            if (e.key === 'Escape') handleRenameCancel(e);
                          }}
                          autoFocus
                          className="document-sidebar__rename-input"
                        />
                        <div className="document-sidebar__rename-actions">
                          <button onClick={(e) => handleRenameSubmit(doc.id, e)} className="document-sidebar__rename-btn">✓</button>
                          <button onClick={handleRenameCancel} className="document-sidebar__rename-btn">✕</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="document-sidebar__item-title">{doc.title}</div>
                        <div className="document-sidebar__item-meta">
                          {doc.wordCount} words · {new Date(doc.updatedAt).toLocaleDateString()}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="document-sidebar__item-menu">
                    <button 
                      className="document-sidebar__menu-btn"
                      onClick={(e) => handleMenuToggle(doc.id, e)}
                      aria-label="Document options"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2"/>
                        <circle cx="12" cy="12" r="2"/>
                        <circle cx="12" cy="19" r="2"/>
                      </svg>
                    </button>
                    {openMenuId === doc.id && (
                      <div ref={dropdownRef} className="document-sidebar__dropdown" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => handleCopy(doc.id, e)} className="document-sidebar__dropdown-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          Make a copy
                        </button>
                        <button onClick={(e) => handleRename(doc, e)} className="document-sidebar__dropdown-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Rename
                        </button>
                        <button onClick={(e) => handleDelete(doc.id, e)} className="document-sidebar__dropdown-item document-sidebar__dropdown-item--danger">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
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
