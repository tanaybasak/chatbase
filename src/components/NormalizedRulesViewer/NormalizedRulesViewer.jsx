/**
 * Normalized Rules Viewer
 * 
 * Displays rules in their normalized format ready for RAG/vector DB
 */

import React, { useState } from 'react';
import { useLegalRules } from '../../hooks/useLegalRules';
import './NormalizedRulesViewer.scss';

function NormalizedRulesViewer() {
  const {
    normalizedRules,
    normalizedStats,
    isLoaded,
    isLoading,
    hasErrors,
    errors
  } = useLegalRules();

  const [selectedRule, setSelectedRule] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'json'

  if (isLoading) {
    return (
      <div className="normalized-rules-viewer">
        <div className="loading">Loading and normalizing rules...</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="normalized-rules-viewer">
        <div className="error">Rules not loaded</div>
      </div>
    );
  }

  if (hasErrors) {
    return (
      <div className="normalized-rules-viewer">
        <div className="error-section">
          <h3>❌ Errors Loading Rules</h3>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="normalized-rules-viewer">
      {/* Header */}
      <div className="viewer-header">
        <div>
          <h2>📊 Normalized Rules for RAG</h2>
          <p className="subtitle">Clean format ready for vector database ingestion</p>
        </div>
        <div className="view-toggle">
          <button
            className={viewMode === 'cards' ? 'active' : ''}
            onClick={() => setViewMode('cards')}
          >
            Card View
          </button>
          <button
            className={viewMode === 'json' ? 'active' : ''}
            onClick={() => setViewMode('json')}
          >
            JSON View
          </button>
        </div>
      </div>

      {/* Statistics */}
      {normalizedStats && (
        <div className="stats-section">
          <h3>Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{normalizedStats.total}</div>
              <div className="stat-label">Total Rules</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{normalizedStats.averageTextLength}</div>
              <div className="stat-label">Avg Text Length</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {Object.keys(normalizedStats.bySeverity).length}
              </div>
              <div className="stat-label">Severity Levels</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {Object.keys(normalizedStats.byContractType).length}
              </div>
              <div className="stat-label">Contract Types</div>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="breakdown">
            <h4>By Severity</h4>
            <div className="breakdown-items">
              {Object.entries(normalizedStats.bySeverity).map(([severity, count]) => (
                <div key={severity} className={`breakdown-item severity-${severity}`}>
                  <span className="label">{severity}</span>
                  <span className="count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contract Type Breakdown */}
          <div className="breakdown">
            <h4>By Contract Type</h4>
            <div className="breakdown-items">
              {Object.entries(normalizedStats.byContractType).map(([type, count]) => (
                <div key={type} className="breakdown-item">
                  <span className="label">{type}</span>
                  <span className="count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rules Display */}
      <div className="rules-section">
        <h3>Normalized Rules ({normalizedRules.length})</h3>

        {viewMode === 'cards' ? (
          <div className="rules-cards">
            {normalizedRules.map((rule) => (
              <div key={rule.id} className="rule-card">
                <div className="rule-header">
                  <span className="rule-id">{rule.id}</span>
                  <span className={`severity-badge ${rule.metadata.severity}`}>
                    {rule.metadata.severity}
                  </span>
                </div>

                <div className="rule-text">
                  <pre>{rule.text}</pre>
                </div>

                <div className="rule-metadata">
                  <div className="metadata-item">
                    <strong>Jurisdiction:</strong> {rule.metadata.jurisdiction}
                  </div>
                  {rule.metadata.category && (
                    <div className="metadata-item">
                      <strong>Category:</strong> {rule.metadata.category}
                    </div>
                  )}
                  <div className="metadata-item">
                    <strong>Contract Types:</strong>{' '}
                    {rule.metadata.contract_types.map(type => (
                      <span key={type} className="contract-badge">{type}</span>
                    ))}
                  </div>
                  {rule.metadata.reference && (
                    <div className="metadata-item">
                      <strong>Reference:</strong> {rule.metadata.reference}
                    </div>
                  )}
                </div>

                <button
                  className="view-json-btn"
                  onClick={() => setSelectedRule(rule)}
                >
                  View JSON
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rules-json">
            <pre>{JSON.stringify(normalizedRules, null, 2)}</pre>
          </div>
        )}
      </div>

      {/* JSON Modal */}
      {selectedRule && (
        <div className="modal-overlay" onClick={() => setSelectedRule(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Normalized Rule JSON: {selectedRule.id}</h3>
              <button className="close-btn" onClick={() => setSelectedRule(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <pre>{JSON.stringify(selectedRule, null, 2)}</pre>
            </div>
            <div className="modal-footer">
              <button
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedRule, null, 2));
                  alert('Copied to clipboard!');
                }}
              >
                📋 Copy JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Export */}
      <div className="export-section">
        <h3>Export Normalized Rules</h3>
        <p>Ready for vector database ingestion (Pinecone, Weaviate, etc.)</p>
        <button
          className="export-btn"
          onClick={() => {
            const dataStr = JSON.stringify(normalizedRules, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'normalized-legal-rules.json';
            link.click();
          }}
        >
          📥 Download JSON
        </button>
      </div>
    </div>
  );
}

export default NormalizedRulesViewer;
