/**
 * US Legal Rules Loader & Validator
 * 
 * Loads the legal rules dataset and validates required fields.
 * This runs at app startup to ensure rules are available in-memory.
 */

// Import the JSONC file as text and parse it manually (strips comments)
let rulesData = null;

// Fetch and parse the JSONC file
async function fetchRulesData() {
  try {
    const response = await fetch('/data/us-legal-rules.jsonc');
    const text = await response.text();
    
    // Strip comments from JSONC
    const jsonText = text
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments
    
    rulesData = JSON.parse(jsonText);
    return rulesData;
  } catch (error) {
    console.error('Error fetching rules data:', error);
    throw error;
  }
}

/**
 * Validates a single rule object
 * @param {Object} rule - Rule object to validate
 * @param {number} index - Rule index for error reporting
 * @returns {Object} Validation result { isValid: boolean, errors: string[] }
 */
function validateRule(rule, index) {
  const errors = [];
  const requiredFields = ['rule_id', 'rule', 'severity', 'contract_types'];

  // Check for required fields
  requiredFields.forEach(field => {
    if (!rule[field]) {
      errors.push(`Rule at index ${index}: Missing required field '${field}'`);
    }
  });

  // Validate rule_id format
  if (rule.rule_id && typeof rule.rule_id !== 'string') {
    errors.push(`Rule at index ${index}: 'rule_id' must be a string`);
  }

  // Validate rule text
  if (rule.rule && typeof rule.rule !== 'string') {
    errors.push(`Rule at index ${index}: 'rule' must be a string`);
  }

  // Validate severity
  const validSeverities = ['low', 'medium', 'high'];
  if (rule.severity && !validSeverities.includes(rule.severity)) {
    errors.push(`Rule at index ${index}: 'severity' must be one of: ${validSeverities.join(', ')}`);
  }

  // Validate contract_types
  if (rule.contract_types) {
    if (!Array.isArray(rule.contract_types)) {
      errors.push(`Rule at index ${index}: 'contract_types' must be an array`);
    } else if (rule.contract_types.length === 0) {
      errors.push(`Rule at index ${index}: 'contract_types' array cannot be empty`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Loads and validates the legal rules dataset
 * @returns {Promise<Object>} { success: boolean, rules: Array, metadata: Object, errors: string[] }
 */
export async function loadLegalRules() {
  const validationErrors = [];
  
  try {
    // Fetch the rules data if not already loaded
    if (!rulesData) {
      await fetchRulesData();
    }
    
    // Check if rules data exists
    if (!rulesData) {
      return {
        success: false,
        rules: [],
        metadata: null,
        errors: ['Failed to load rules data file']
      };
    }

    // Check if rules array exists
    if (!rulesData.rules || !Array.isArray(rulesData.rules)) {
      return {
        success: false,
        rules: [],
        metadata: rulesData.metadata || null,
        errors: ['Rules data must contain a "rules" array']
      };
    }

    // Validate each rule
    const validatedRules = [];
    rulesData.rules.forEach((rule, index) => {
      const validation = validateRule(rule, index);
      
      if (validation.isValid) {
        validatedRules.push(rule);
      } else {
        validationErrors.push(...validation.errors);
      }
    });

    // Return results
    const success = validationErrors.length === 0;
    
    return {
      success,
      rules: validatedRules,
      metadata: rulesData.metadata || null,
      errors: validationErrors,
      stats: {
        total: rulesData.rules.length,
        valid: validatedRules.length,
        invalid: rulesData.rules.length - validatedRules.length
      }
    };

  } catch (error) {
    return {
      success: false,
      rules: [],
      metadata: null,
      errors: [`Error loading rules: ${error.message}`]
    };
  }
}

/**
 * Get rules by severity level
 * @param {Array} rules - Array of rule objects
 * @param {string} severity - Severity level ('low', 'medium', 'high')
 * @returns {Array} Filtered rules
 */
export function getRulesBySeverity(rules, severity) {
  return rules.filter(rule => rule.severity === severity);
}

/**
 * Get rules by contract type
 * @param {Array} rules - Array of rule objects
 * @param {string} contractType - Contract type (e.g., 'NDA', 'MSA')
 * @returns {Array} Filtered rules
 */
export function getRulesByContractType(rules, contractType) {
  return rules.filter(rule => 
    rule.contract_types && rule.contract_types.includes(contractType)
  );
}

/**
 * Get rules by category
 * @param {Array} rules - Array of rule objects
 * @param {string} category - Category name
 * @returns {Array} Filtered rules
 */
export function getRulesByCategory(rules, category) {
  return rules.filter(rule => rule.category === category);
}

/**
 * Get rule by ID
 * @param {Array} rules - Array of rule objects
 * @param {string} ruleId - Rule ID to find
 * @returns {Object|null} Rule object or null if not found
 */
export function getRuleById(rules, ruleId) {
  return rules.find(rule => rule.rule_id === ruleId) || null;
}

export default loadLegalRules;
