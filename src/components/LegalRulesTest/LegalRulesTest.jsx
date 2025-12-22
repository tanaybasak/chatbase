/**
 * LegalRulesTest Component
 * 
 * Demonstrates loading and validation of US legal rules.
 * Displays rules statistics and validation status.
 */

import React from 'react';
import { useLegalRules } from '../../hooks/useLegalRules';
import './LegalRulesTest.scss';

function LegalRulesTest() {
  const {
    rules,
    metadata,
    isLoaded,
    isLoading,
    errors,
    stats,
    hasErrors,
    isValid,
    totalRules,
    filterBySeverity,
    filterByContractType,
    filterByCategory
  } = useLegalRules();

  if (isLoading) {
    return (
      <div className="legal-rules-test">
        <div className="loading">Loading legal rules...</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="legal-rules-test">
        <div className="error">Rules not loaded</div>
      </div>
    );
  }

  // Get statistics by severity
  const highSeverityRules = filterBySeverity('high');
  const mediumSeverityRules = filterBySeverity('medium');
  const lowSeverityRules = filterBySeverity('low');

  // Get statistics by contract type
  const ndaRules = filterByContractType('NDA');
  const msaRules = filterByContractType('MSA');

  return (
    <div className="legal-rules-test">
      <div className="test-header">
        <h2>📚 US Legal Rules - Loaded & Validated</h2>
        <div className={`status ${isValid ? 'valid' : 'invalid'}`}>
          {isValid ? '✅ All rules valid' : '❌ Validation errors detected'}
        </div>
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="metadata-section">
          <h3>Metadata</h3>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="label">Jurisdiction:</span>
              <span className="value">{metadata.jurisdiction}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Version:</span>
              <span className="value">{metadata.version}</span>
            </div>
            <div className="metadata-item">
              <span className="label">Contract Types:</span>
              <span className="value">{metadata.supported_contract_types?.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-section">
        <h3>Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats?.total || 0}</div>
            <div className="stat-label">Total Rules</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{stats?.valid || 0}</div>
            <div className="stat-label">Valid</div>
          </div>
          {stats?.invalid > 0 && (
            <div className="stat-card error">
              <div className="stat-value">{stats.invalid}</div>
              <div className="stat-label">Invalid</div>
            </div>
          )}
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="severity-section">
        <h3>Severity Breakdown</h3>
        <div className="severity-grid">
          <div className="severity-card high">
            <div className="severity-value">{highSeverityRules.length}</div>
            <div className="severity-label">High</div>
          </div>
          <div className="severity-card medium">
            <div className="severity-value">{mediumSeverityRules.length}</div>
            <div className="severity-label">Medium</div>
          </div>
          <div className="severity-card low">
            <div className="severity-value">{lowSeverityRules.length}</div>
            <div className="severity-label">Low</div>
          </div>
        </div>
      </div>

      {/* Contract Type Breakdown */}
      <div className="contract-type-section">
        <h3>Contract Type Coverage</h3>
        <div className="contract-type-grid">
          <div className="contract-type-card">
            <div className="contract-type-value">{ndaRules.length}</div>
            <div className="contract-type-label">NDA Rules</div>
          </div>
          <div className="contract-type-card">
            <div className="contract-type-value">{msaRules.length}</div>
            <div className="contract-type-label">MSA Rules</div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {hasErrors && (
        <div className="errors-section">
          <h3>❌ Validation Errors</h3>
          <ul className="error-list">
            {errors.map((error, index) => (
              <li key={index} className="error-item">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Rules List */}
      <div className="rules-section">
        <h3>Loaded Rules ({totalRules})</h3>
        <div className="rules-list">
          {rules.map((rule, index) => (
            <div key={rule.rule_id || index} className="rule-card">
              <div className="rule-header">
                <span className="rule-id">{rule.rule_id}</span>
                <span className={`rule-severity ${rule.severity}`}>{rule.severity}</span>
              </div>
              <div className="rule-category">{rule.category}</div>
              <div className="rule-text">{rule.rule}</div>
              <div className="rule-contracts">
                {rule.contract_types?.map(type => (
                  <span key={type} className="contract-badge">{type}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default LegalRulesTest;
