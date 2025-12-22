/**
 * Complete Example: Normalized Rules Integration
 * 
 * Shows how to use normalized rules in your application
 * for RAG, vector DB, or document checking.
 */

import React, { useState } from 'react';
import { useLegalRules } from '../../hooks/useLegalRules';

function NormalizedRulesExample() {
  const {
    normalizedRules,
    normalizedStats,
    isLoaded,
    filterNormalized
  } = useLegalRules();

  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedContractType, setSelectedContractType] = useState('all');

  if (!isLoaded) {
    return <div>Loading rules...</div>;
  }

  // Example 1: Filter rules
  const getFilteredRules = () => {
    const filters = {};
    
    if (selectedSeverity !== 'all') {
      filters.severity = selectedSeverity;
    }
    
    if (selectedContractType !== 'all') {
      filters.contractType = selectedContractType;
    }
    
    return filterNormalized(filters);
  };

  const filteredRules = getFilteredRules();

  // Example 2: Prepare for vector DB
  const prepareForVectorDB = () => {
    return normalizedRules.map(rule => ({
      id: rule.id,
      text: rule.text,
      metadata: rule.metadata,
      // Placeholder for embedding vector (to be generated)
      embedding: null
    }));
  };

  // Example 3: Export as JSON
  const exportJSON = () => {
    const data = prepareForVectorDB();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'normalized-legal-rules.json';
    link.click();
  };

  // Example 4: Search in normalized text
  const searchRules = (query) => {
    const lowerQuery = query.toLowerCase();
    return normalizedRules.filter(rule =>
      rule.text.toLowerCase().includes(lowerQuery)
    );
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>📚 Normalized Rules Integration Example</h1>

      {/* Statistics */}
      <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <strong>Total Rules:</strong> {normalizedStats.total}
          </div>
          <div>
            <strong>Avg Text Length:</strong> {normalizedStats.averageTextLength} chars
          </div>
          <div>
            <strong>Severities:</strong> {Object.keys(normalizedStats.bySeverity).length}
          </div>
          <div>
            <strong>Contract Types:</strong> {Object.keys(normalizedStats.byContractType).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>Filter Rules</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div>
            <label>Severity: </label>
            <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)}>
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label>Contract Type: </label>
            <select value={selectedContractType} onChange={(e) => setSelectedContractType(e.target.value)}>
              <option value="all">All</option>
              <option value="NDA">NDA</option>
              <option value="MSA">MSA</option>
            </select>
          </div>
        </div>
        <p>Showing {filteredRules.length} of {normalizedRules.length} rules</p>
      </div>

      {/* Export Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={exportJSON}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#10a37f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          📥 Download Normalized Rules (JSON)
        </button>
      </div>

      {/* Display Rules */}
      <div>
        <h3>Normalized Rules</h3>
        {filteredRules.map(rule => (
          <div
            key={rule.id}
            style={{
              background: 'white',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <strong style={{ color: '#10a37f' }}>{rule.id}</strong>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  background: rule.metadata.severity === 'high' ? '#f8d7da' :
                             rule.metadata.severity === 'medium' ? '#fff3cd' : '#d1ecf1',
                  color: rule.metadata.severity === 'high' ? '#721c24' :
                         rule.metadata.severity === 'medium' ? '#856404' : '#0c5460'
                }}
              >
                {rule.metadata.severity}
              </span>
            </div>

            {/* Text */}
            <div
              style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '6px',
                borderLeft: '4px solid #10a37f',
                marginBottom: '1rem',
                whiteSpace: 'pre-wrap',
                fontFamily: 'Monaco, monospace',
                fontSize: '0.9rem',
                lineHeight: '1.6'
              }}
            >
              {rule.text}
            </div>

            {/* Metadata */}
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              <div><strong>Jurisdiction:</strong> {rule.metadata.jurisdiction}</div>
              {rule.metadata.category && (
                <div><strong>Category:</strong> {rule.metadata.category}</div>
              )}
              <div>
                <strong>Contract Types:</strong>{' '}
                {rule.metadata.contract_types.map(type => (
                  <span
                    key={type}
                    style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.5rem',
                      background: '#e7f5f2',
                      color: '#10a37f',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      marginLeft: '0.25rem'
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
              {rule.metadata.reference && (
                <div><strong>Reference:</strong> {rule.metadata.reference}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Example Code */}
      <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
        <h3 style={{ color: '#d4d4d4' }}>Example: Vector DB Integration</h3>
        <pre style={{ margin: 0, overflow: 'auto' }}>
{`// Prepare rules for vector database
const vectorDBData = normalizedRules.map(rule => ({
  id: rule.id,
  text: rule.text,
  metadata: rule.metadata
}));

// Example with Pinecone
import { PineconeClient } from '@pinecone-database/pinecone';

const pinecone = new PineconeClient();
await pinecone.init({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.Index('legal-rules');

// Generate embeddings and upsert
for (const rule of normalizedRules) {
  const embedding = await generateEmbedding(rule.text);
  await index.upsert({
    id: rule.id,
    values: embedding,
    metadata: rule.metadata
  });
}

console.log('✅ All rules uploaded to vector DB');`}
        </pre>
      </div>
    </div>
  );
}

export default NormalizedRulesExample;
