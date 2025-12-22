/**
 * Example: Using Legal Rules in Main App
 * 
 * This shows how to integrate the rules loader into your document editor
 * to display rule information or perform basic checks.
 */

import React from 'react';
import { useLegalRules } from '../hooks/useLegalRules';

function DocumentEditorWithRules() {
  const { 
    rules, 
    isLoaded, 
    isValid, 
    filterBySeverity,
    filterByContractType 
  } = useLegalRules();

  // Example: Get high-severity rules for NDA
  const criticalNDARules = React.useMemo(() => {
    if (!isLoaded) return [];
    const highSeverity = filterBySeverity('high');
    return filterByContractType('NDA').filter(rule => 
      highSeverity.includes(rule)
    );
  }, [isLoaded, filterBySeverity, filterByContractType]);

  return (
    <div className="document-editor-with-rules">
      <div className="editor-panel">
        {/* Your document editor */}
        <textarea placeholder="Write your document here..." />
      </div>

      <div className="rules-panel">
        <h3>📚 Legal Style Guide</h3>
        
        {!isLoaded && <p>Loading rules...</p>}
        
        {isLoaded && !isValid && (
          <p className="error">⚠️ Rules validation failed</p>
        )}
        
        {isLoaded && isValid && (
          <>
            <p className="info">
              ✅ {rules.length} rules loaded
            </p>
            
            <div className="critical-rules">
              <h4>Critical NDA Rules ({criticalNDARules.length})</h4>
              <ul>
                {criticalNDARules.map(rule => (
                  <li key={rule.rule_id}>
                    <strong>{rule.rule_id}:</strong> {rule.rule}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DocumentEditorWithRules;
