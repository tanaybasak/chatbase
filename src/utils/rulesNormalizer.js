/**
 * Rules Normalizer for RAG
 * 
 * Transforms legal rules into a clean format suitable for vector databases.
 * Each rule becomes: { id, text, metadata }
 */

/**
 * Normalizes a single rule for RAG/vector DB
 * @param {Object} rule - Raw rule object
 * @param {string} jurisdiction - Dataset jurisdiction (from metadata)
 * @returns {Object} Normalized rule { id, text, metadata }
 */
export function normalizeRule(rule, jurisdiction = 'US') {
  // Build clean text representation
  const textParts = [];
  
  // Add the main rule
  textParts.push(`Rule: ${rule.rule}`);
  
  // Add bad example if available
  if (rule.bad_example) {
    textParts.push(`Bad example: ${rule.bad_example}`);
  }
  
  // Add good example if available
  if (rule.good_example) {
    textParts.push(`Good example: ${rule.good_example}`);
  }
  
  // Add explanation if available
  if (rule.explanation) {
    textParts.push(`Explanation: ${rule.explanation}`);
  }
  
  // Join with newlines and trim
  const text = textParts.join('\n').trim();
  
  // Build metadata (exclude comments, notes, and examples that are in text)
  const metadata = {
    jurisdiction: rule.jurisdiction || jurisdiction,
    severity: rule.severity,
    contract_types: rule.contract_types
  };
  
  // Add optional metadata fields if present
  if (rule.category) {
    metadata.category = rule.category;
  }
  
  if (rule.reference) {
    metadata.reference = rule.reference;
  }
  
  return {
    id: rule.rule_id,
    text,
    metadata
  };
}

/**
 * Normalizes all rules from the dataset
 * @param {Object} rulesData - Result from loadLegalRules()
 * @returns {Array} Array of normalized rules
 */
export function normalizeAllRules(rulesData) {
  if (!rulesData || !rulesData.rules || !Array.isArray(rulesData.rules)) {
    return [];
  }
  
  const jurisdiction = rulesData.metadata?.jurisdiction || 'US';
  
  return rulesData.rules.map(rule => normalizeRule(rule, jurisdiction));
}

/**
 * Validates that a normalized rule has all required fields
 * @param {Object} normalizedRule - Normalized rule to validate
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateNormalizedRule(normalizedRule) {
  const errors = [];
  
  // Check required fields
  if (!normalizedRule.id) {
    errors.push('Normalized rule missing id');
  }
  
  if (!normalizedRule.text || typeof normalizedRule.text !== 'string') {
    errors.push('Normalized rule missing or invalid text');
  }
  
  if (!normalizedRule.metadata || typeof normalizedRule.metadata !== 'object') {
    errors.push('Normalized rule missing or invalid metadata');
  } else {
    // Check required metadata fields
    if (!normalizedRule.metadata.jurisdiction) {
      errors.push('Normalized rule metadata missing jurisdiction');
    }
    
    if (!normalizedRule.metadata.severity) {
      errors.push('Normalized rule metadata missing severity');
    }
    
    if (!normalizedRule.metadata.contract_types || !Array.isArray(normalizedRule.metadata.contract_types)) {
      errors.push('Normalized rule metadata missing or invalid contract_types');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets statistics about normalized rules
 * @param {Array} normalizedRules - Array of normalized rules
 * @returns {Object} Statistics object
 */
export function getNormalizedRulesStats(normalizedRules) {
  if (!Array.isArray(normalizedRules)) {
    return null;
  }
  
  const stats = {
    total: normalizedRules.length,
    averageTextLength: 0,
    bySeverity: {},
    byContractType: {},
    byCategory: {},
    byJurisdiction: {}
  };
  
  let totalTextLength = 0;
  
  normalizedRules.forEach(rule => {
    // Text length
    totalTextLength += rule.text.length;
    
    // By severity
    const severity = rule.metadata.severity;
    stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
    
    // By contract type
    rule.metadata.contract_types.forEach(type => {
      stats.byContractType[type] = (stats.byContractType[type] || 0) + 1;
    });
    
    // By category
    if (rule.metadata.category) {
      const category = rule.metadata.category;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }
    
    // By jurisdiction
    const jurisdiction = rule.metadata.jurisdiction;
    stats.byJurisdiction[jurisdiction] = (stats.byJurisdiction[jurisdiction] || 0) + 1;
  });
  
  stats.averageTextLength = Math.round(totalTextLength / normalizedRules.length);
  
  return stats;
}

/**
 * Filters normalized rules by metadata
 * @param {Array} normalizedRules - Array of normalized rules
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered rules
 */
export function filterNormalizedRules(normalizedRules, filters = {}) {
  if (!Array.isArray(normalizedRules)) {
    return [];
  }
  
  return normalizedRules.filter(rule => {
    // Filter by severity
    if (filters.severity && rule.metadata.severity !== filters.severity) {
      return false;
    }
    
    // Filter by contract type
    if (filters.contractType && !rule.metadata.contract_types.includes(filters.contractType)) {
      return false;
    }
    
    // Filter by category
    if (filters.category && rule.metadata.category !== filters.category) {
      return false;
    }
    
    // Filter by jurisdiction
    if (filters.jurisdiction && rule.metadata.jurisdiction !== filters.jurisdiction) {
      return false;
    }
    
    return true;
  });
}

export default normalizeAllRules;
