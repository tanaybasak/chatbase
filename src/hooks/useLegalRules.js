/**
 * React Hook: useLegalRules
 * 
 * Manages the legal rules dataset in the application.
 * Loads and validates rules at initialization.
 */

import { useState, useEffect } from 'react';
import { loadLegalRules, getRulesBySeverity, getRulesByContractType, getRulesByCategory, getRuleById } from '../utils/rulesLoader';
import { normalizeAllRules, getNormalizedRulesStats, filterNormalizedRules } from '../utils/rulesNormalizer';

export function useLegalRules() {
  const [state, setState] = useState({
    rules: [],
    normalizedRules: [],
    metadata: null,
    isLoaded: false,
    isLoading: false,
    errors: [],
    stats: null,
    normalizedStats: null
  });

  // Load rules on mount
  useEffect(() => {
    let isMounted = true;
    
    async function loadRules() {
      setState(prev => ({ ...prev, isLoading: true }));

      try {
        const result = await loadLegalRules();
        
        if (isMounted) {
          // Normalize rules for RAG
          const normalized = normalizeAllRules(result);
          const normalizedStats = getNormalizedRulesStats(normalized);
          
          setState({
            rules: result.rules,
            normalizedRules: normalized,
            metadata: result.metadata,
            isLoaded: true,
            isLoading: false,
            errors: result.errors,
            stats: result.stats,
            normalizedStats
          });

          // Log validation results to console
          if (result.success) {
            console.log('✅ Legal rules loaded successfully:', {
              total: result.stats.total,
              valid: result.stats.valid,
              invalid: result.stats.invalid
            });
            console.log('📝 Normalized for RAG:', {
              count: normalized.length,
              averageTextLength: normalizedStats.averageTextLength
            });
          } else {
            console.error('❌ Legal rules validation failed:', result.errors);
          }
        }

      } catch (error) {
        if (isMounted) {
          setState({
            rules: [],
            normalizedRules: [],
            metadata: null,
            isLoaded: true,
            isLoading: false,
            errors: [error.message],
            stats: null,
            normalizedStats: null
          });
          console.error('❌ Error loading legal rules:', error);
        }
      }
    }

    loadRules();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper functions
  const filterBySeverity = (severity) => {
    return getRulesBySeverity(state.rules, severity);
  };

  const filterByContractType = (contractType) => {
    return getRulesByContractType(state.rules, contractType);
  };

  const filterByCategory = (category) => {
    return getRulesByCategory(state.rules, category);
  };

  const findRuleById = (ruleId) => {
    return getRuleById(state.rules, ruleId);
  };

  const filterNormalized = (filters) => {
    return filterNormalizedRules(state.normalizedRules, filters);
  };

  return {
    // State
    rules: state.rules,
    normalizedRules: state.normalizedRules,
    metadata: state.metadata,
    isLoaded: state.isLoaded,
    isLoading: state.isLoading,
    errors: state.errors,
    stats: state.stats,
    normalizedStats: state.normalizedStats,
    
    // Helper methods
    filterBySeverity,
    filterByContractType,
    filterByCategory,
    findRuleById,
    filterNormalized,
    
    // Computed properties
    hasErrors: state.errors.length > 0,
    isValid: state.isLoaded && state.errors.length === 0,
    totalRules: state.rules.length,
    totalNormalizedRules: state.normalizedRules.length
  };
}

export default useLegalRules;
