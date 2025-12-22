# Normalization API Reference

## Import

```javascript
import {
  normalizeRule,
  normalizeAllRules,
  validateNormalizedRule,
  getNormalizedRulesStats,
  filterNormalizedRules
} from './utils/rulesNormalizer';
```

## Functions

### normalizeRule(rule, jurisdiction)

Transforms a single rule into RAG format.

**Parameters:**
- `rule` (Object) - Raw rule object from dataset
- `jurisdiction` (string, optional) - Default jurisdiction if not in rule (default: 'US')

**Returns:** Object
```javascript
{
  id: string,
  text: string,
  metadata: {
    jurisdiction: string,
    severity: string,
    contract_types: string[],
    category?: string,
    reference?: string
  }
}
```

**Example:**
```javascript
const rawRule = {
  rule_id: 'US_LEGAL_001',
  rule: "Use 'shall' for obligations",
  bad_example: "Company will deliver",
  good_example: "Company shall deliver",
  severity: 'high',
  contract_types: ['NDA'],
  category: 'Obligations'
};

const normalized = normalizeRule(rawRule);

console.log(normalized);
// {
//   id: 'US_LEGAL_001',
//   text: "Rule: Use 'shall' for obligations\nBad example: Company will deliver\nGood example: Company shall deliver",
//   metadata: {
//     jurisdiction: 'US',
//     severity: 'high',
//     contract_types: ['NDA'],
//     category: 'Obligations'
//   }
// }
```

### normalizeAllRules(rulesData)

Normalizes entire dataset from loadLegalRules() result.

**Parameters:**
- `rulesData` (Object) - Result object from loadLegalRules()

**Returns:** Array of normalized rules

**Example:**
```javascript
import { loadLegalRules } from './utils/rulesLoader';
import { normalizeAllRules } from './utils/rulesNormalizer';

const result = await loadLegalRules();
const normalized = normalizeAllRules(result);

console.log(normalized.length); // 11
console.log(normalized[0]);
// { id: '...', text: '...', metadata: {...} }
```

### validateNormalizedRule(normalizedRule)

Validates a normalized rule structure.

**Parameters:**
- `normalizedRule` (Object) - Normalized rule to validate

**Returns:** Object
```javascript
{
  isValid: boolean,
  errors: string[]
}
```

**Example:**
```javascript
const normalized = normalizeRule(rawRule);
const validation = validateNormalizedRule(normalized);

if (validation.isValid) {
  console.log('✅ Valid');
} else {
  console.error('❌ Errors:', validation.errors);
}
```

### getNormalizedRulesStats(normalizedRules)

Calculates statistics about normalized rules.

**Parameters:**
- `normalizedRules` (Array) - Array of normalized rules

**Returns:** Object
```javascript
{
  total: number,
  averageTextLength: number,
  bySeverity: { [key: string]: number },
  byContractType: { [key: string]: number },
  byCategory: { [key: string]: number },
  byJurisdiction: { [key: string]: number }
}
```

**Example:**
```javascript
const stats = getNormalizedRulesStats(normalizedRules);

console.log(stats);
// {
//   total: 11,
//   averageTextLength: 237,
//   bySeverity: { high: 5, medium: 5, low: 1 },
//   byContractType: { NDA: 10, MSA: 11 },
//   byCategory: { Obligations: 1, ... },
//   byJurisdiction: { US: 11 }
// }
```

### filterNormalizedRules(normalizedRules, filters)

Filters normalized rules by metadata.

**Parameters:**
- `normalizedRules` (Array) - Array of normalized rules
- `filters` (Object) - Filter criteria
  - `severity` (string, optional) - Filter by severity
  - `contractType` (string, optional) - Filter by contract type
  - `category` (string, optional) - Filter by category
  - `jurisdiction` (string, optional) - Filter by jurisdiction

**Returns:** Array of filtered rules

**Example:**
```javascript
// Get high-severity rules
const highSeverity = filterNormalizedRules(normalizedRules, {
  severity: 'high'
});

// Get NDA rules
const ndaRules = filterNormalizedRules(normalizedRules, {
  contractType: 'NDA'
});

// Get high-severity NDA rules in Obligations category
const specific = filterNormalizedRules(normalizedRules, {
  severity: 'high',
  contractType: 'NDA',
  category: 'Obligations'
});
```

## Hook API

### useLegalRules() - Updated

```javascript
const {
  // Original fields
  rules,
  metadata,
  isLoaded,
  isLoading,
  errors,
  stats,
  
  // NEW: Normalized fields
  normalizedRules,           // Array of normalized rules
  normalizedStats,           // Statistics for normalized rules
  totalNormalizedRules,      // Count
  
  // NEW: Method
  filterNormalized,          // (filters) => Array
  
  // Existing methods
  filterBySeverity,
  filterByContractType,
  filterByCategory,
  findRuleById
} = useLegalRules();
```

## Text Format Structure

Normalized text follows this pattern:

```
Rule: [main rule text]
Bad example: [bad example if present]
Good example: [good example if present]
Explanation: [explanation if present]
```

**Notes:**
- Each section on a new line
- Sections only included if data exists
- No extra whitespace or formatting
- No comments or metadata notes

## Common Patterns

### Pattern 1: Export for Vector DB

```javascript
const { normalizedRules } = useLegalRules();

// Export as JSON
const exportData = normalizedRules.map(rule => ({
  id: rule.id,
  vector: null, // Placeholder for embedding
  text: rule.text,
  metadata: rule.metadata
}));

console.log(JSON.stringify(exportData, null, 2));
```

### Pattern 2: Generate Embeddings

```javascript
import OpenAI from 'openai';

const openai = new OpenAI();

async function embedRules(normalizedRules) {
  return await Promise.all(
    normalizedRules.map(async (rule) => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: rule.text
      });
      
      return {
        id: rule.id,
        embedding: response.data[0].embedding,
        text: rule.text,
        metadata: rule.metadata
      };
    })
  );
}
```

### Pattern 3: Filter and Export

```javascript
const { filterNormalized } = useLegalRules();

// Get only high-severity rules for specific contract type
const criticalRules = filterNormalized({
  severity: 'high',
  contractType: 'NDA'
});

// Export
const json = JSON.stringify(criticalRules, null, 2);
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
// Download...
```

### Pattern 4: Batch Processing

```javascript
async function processBatch(normalizedRules, batchSize = 5) {
  const batches = [];
  
  for (let i = 0; i < normalizedRules.length; i += batchSize) {
    const batch = normalizedRules.slice(i, i + batchSize);
    batches.push(batch);
  }
  
  for (const batch of batches) {
    await processBatchRules(batch);
  }
}
```

### Pattern 5: Validation Check

```javascript
import { validateNormalizedRule } from './utils/rulesNormalizer';

function validateAll(normalizedRules) {
  const results = normalizedRules.map(rule => ({
    id: rule.id,
    ...validateNormalizedRule(rule)
  }));
  
  const invalid = results.filter(r => !r.isValid);
  
  if (invalid.length > 0) {
    console.error('Invalid rules:', invalid);
  } else {
    console.log('✅ All rules valid');
  }
  
  return invalid.length === 0;
}
```

## TypeScript Types

```typescript
interface NormalizedRule {
  id: string;
  text: string;
  metadata: {
    jurisdiction: string;
    severity: 'low' | 'medium' | 'high';
    contract_types: string[];
    category?: string;
    reference?: string;
  };
}

interface NormalizedStats {
  total: number;
  averageTextLength: number;
  bySeverity: Record<string, number>;
  byContractType: Record<string, number>;
  byCategory: Record<string, number>;
  byJurisdiction: Record<string, number>;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface FilterOptions {
  severity?: 'low' | 'medium' | 'high';
  contractType?: string;
  category?: string;
  jurisdiction?: string;
}
```

## Error Handling

```javascript
try {
  const result = await loadLegalRules();
  
  if (!result.success) {
    throw new Error('Failed to load rules');
  }
  
  const normalized = normalizeAllRules(result);
  
  if (normalized.length === 0) {
    throw new Error('No rules to normalize');
  }
  
  // Validate all
  const allValid = normalized.every(rule => 
    validateNormalizedRule(rule).isValid
  );
  
  if (!allValid) {
    throw new Error('Some rules failed validation');
  }
  
  console.log('✅ All rules normalized and validated');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
```
