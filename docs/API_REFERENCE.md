# Quick Reference: Legal Rules Loader API

## Import

```javascript
// React Hook (Recommended)
import { useLegalRules } from './hooks/useLegalRules';

// Direct Utility Functions
import { 
  loadLegalRules, 
  getRulesBySeverity,
  getRulesByContractType,
  getRulesByCategory,
  getRuleById
} from './utils/rulesLoader';
```

## useLegalRules() Hook

### Basic Usage

```javascript
function MyComponent() {
  const { rules, isLoaded } = useLegalRules();
  
  if (!isLoaded) return <div>Loading...</div>;
  
  return <div>{rules.length} rules</div>;
}
```

### Full API

```javascript
const {
  // Data
  rules,              // Array<Rule> - All validated rules
  metadata,           // Object - Dataset metadata
  stats,              // Object - { total, valid, invalid }
  errors,             // Array<string> - Validation errors
  
  // State
  isLoaded,           // boolean - Loading complete
  isLoading,          // boolean - Currently loading
  hasErrors,          // boolean - Any validation errors
  isValid,            // boolean - All rules valid
  totalRules,         // number - Total rule count
  
  // Methods
  filterBySeverity,   // (severity: string) => Array<Rule>
  filterByContractType, // (type: string) => Array<Rule>
  filterByCategory,   // (category: string) => Array<Rule>
  findRuleById        // (id: string) => Rule | null
} = useLegalRules();
```

### Return Types

```typescript
{
  rules: Rule[];
  metadata: {
    jurisdiction: string;
    version: string;
    supported_contract_types: string[];
    notes?: string;
  } | null;
  stats: {
    total: number;
    valid: number;
    invalid: number;
  } | null;
  errors: string[];
  isLoaded: boolean;
  isLoading: boolean;
  hasErrors: boolean;
  isValid: boolean;
  totalRules: number;
  filterBySeverity: (severity: 'low' | 'medium' | 'high') => Rule[];
  filterByContractType: (type: string) => Rule[];
  filterByCategory: (category: string) => Rule[];
  findRuleById: (id: string) => Rule | null;
}
```

### Rule Type

```typescript
interface Rule {
  rule_id: string;              // Required: e.g., "US_LEGAL_001"
  rule: string;                 // Required: The rule text
  severity: 'low' | 'medium' | 'high';  // Required
  contract_types: string[];     // Required: e.g., ["NDA", "MSA"]
  category?: string;            // Optional: e.g., "Obligations"
  bad_example?: string;         // Optional
  good_example?: string;        // Optional
  explanation?: string;         // Optional
  reference?: string;           // Optional
  jurisdiction?: string;        // Optional
}
```

## Common Use Cases

### 1. Display All Rules

```javascript
function RulesList() {
  const { rules, isLoaded } = useLegalRules();
  
  if (!isLoaded) return null;
  
  return (
    <ul>
      {rules.map(rule => (
        <li key={rule.rule_id}>{rule.rule}</li>
      ))}
    </ul>
  );
}
```

### 2. Filter by Severity

```javascript
function HighPriorityRules() {
  const { filterBySeverity, isLoaded } = useLegalRules();
  
  if (!isLoaded) return null;
  
  const highRules = filterBySeverity('high');
  
  return (
    <div>
      <h3>High Priority ({highRules.length})</h3>
      {highRules.map(rule => (
        <div key={rule.rule_id}>{rule.rule}</div>
      ))}
    </div>
  );
}
```

### 3. Filter by Contract Type

```javascript
function NDAGuidance() {
  const { filterByContractType, isLoaded } = useLegalRules();
  
  if (!isLoaded) return null;
  
  const ndaRules = filterByContractType('NDA');
  
  return (
    <div>
      <h3>NDA Rules ({ndaRules.length})</h3>
      {ndaRules.map(rule => (
        <div key={rule.rule_id}>
          <strong>{rule.category}:</strong> {rule.rule}
        </div>
      ))}
    </div>
  );
}
```

### 4. Find Specific Rule

```javascript
function RuleDetails({ ruleId }) {
  const { findRuleById, isLoaded } = useLegalRules();
  
  if (!isLoaded) return null;
  
  const rule = findRuleById(ruleId);
  
  if (!rule) return <div>Rule not found</div>;
  
  return (
    <div>
      <h3>{rule.rule_id}</h3>
      <p>{rule.rule}</p>
      {rule.bad_example && (
        <div>
          <strong>❌ Bad:</strong> {rule.bad_example}
        </div>
      )}
      {rule.good_example && (
        <div>
          <strong>✅ Good:</strong> {rule.good_example}
        </div>
      )}
    </div>
  );
}
```

### 5. Show Validation Status

```javascript
function ValidationStatus() {
  const { isLoaded, isValid, stats, errors } = useLegalRules();
  
  if (!isLoaded) return <div>Loading rules...</div>;
  
  return (
    <div>
      {isValid ? (
        <div>✅ All {stats.valid} rules loaded successfully</div>
      ) : (
        <div>
          ⚠️ {stats.invalid} invalid rules
          <ul>
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 6. Combine Filters

```javascript
function CriticalNDAObligations() {
  const { rules, filterBySeverity, filterByContractType, filterByCategory, isLoaded } = useLegalRules();
  
  if (!isLoaded) return null;
  
  // Get high-severity NDA rules about obligations
  const criticalRules = rules
    .filter(rule => rule.severity === 'high')
    .filter(rule => rule.contract_types.includes('NDA'))
    .filter(rule => rule.category === 'Obligations');
  
  return (
    <div>
      <h3>Critical NDA Obligations ({criticalRules.length})</h3>
      {criticalRules.map(rule => (
        <div key={rule.rule_id}>{rule.rule}</div>
      ))}
    </div>
  );
}
```

### 7. Group by Category

```javascript
function RulesByCategory() {
  const { rules, isLoaded } = useLegalRules();
  
  if (!isLoaded) return null;
  
  // Group rules by category
  const grouped = rules.reduce((acc, rule) => {
    const category = rule.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(rule);
    return acc;
  }, {});
  
  return (
    <div>
      {Object.entries(grouped).map(([category, categoryRules]) => (
        <div key={category}>
          <h3>{category} ({categoryRules.length})</h3>
          <ul>
            {categoryRules.map(rule => (
              <li key={rule.rule_id}>{rule.rule}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### 8. Loading States

```javascript
function RulesWithLoadingStates() {
  const { rules, isLoading, isLoaded, hasErrors, errors } = useLegalRules();
  
  if (isLoading) {
    return <div className="spinner">Loading rules...</div>;
  }
  
  if (!isLoaded) {
    return <div>Rules not loaded</div>;
  }
  
  if (hasErrors) {
    return (
      <div className="error">
        <h3>Failed to load rules</h3>
        <ul>
          {errors.map((error, i) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
      </div>
    );
  }
  
  return (
    <div>
      <h3>Rules Loaded Successfully</h3>
      {rules.map(rule => (
        <div key={rule.rule_id}>{rule.rule}</div>
      ))}
    </div>
  );
}
```

## Direct Utility Functions

### loadLegalRules()

```javascript
import { loadLegalRules } from './utils/rulesLoader';

async function loadRules() {
  const result = await loadLegalRules();
  
  if (result.success) {
    console.log('Loaded:', result.rules);
    console.log('Stats:', result.stats);
  } else {
    console.error('Errors:', result.errors);
  }
}
```

### Filter Functions

```javascript
import { 
  getRulesBySeverity,
  getRulesByContractType,
  getRulesByCategory,
  getRuleById
} from './utils/rulesLoader';

// After loading rules
const result = await loadLegalRules();
const { rules } = result;

// Filter by severity
const highRules = getRulesBySeverity(rules, 'high');
const mediumRules = getRulesBySeverity(rules, 'medium');

// Filter by contract type
const ndaRules = getRulesByContractType(rules, 'NDA');
const msaRules = getRulesByContractType(rules, 'MSA');

// Filter by category
const obligationRules = getRulesByCategory(rules, 'Obligations');
const clarityRules = getRulesByCategory(rules, 'Clarity');

// Find specific rule
const rule = getRuleById(rules, 'US_LEGAL_001');
```

## Statistics

```javascript
function RulesStatistics() {
  const { stats, metadata, isLoaded } = useLegalRules();
  
  if (!isLoaded) return null;
  
  return (
    <div>
      <h3>Rules Statistics</h3>
      <p>Total: {stats.total}</p>
      <p>Valid: {stats.valid}</p>
      <p>Invalid: {stats.invalid}</p>
      <p>Jurisdiction: {metadata.jurisdiction}</p>
      <p>Version: {metadata.version}</p>
      <p>Contract Types: {metadata.supported_contract_types.join(', ')}</p>
    </div>
  );
}
```

## Testing

```javascript
// Unit test example
import { validateRule } from './utils/rulesLoader';

test('validates rule with all required fields', () => {
  const rule = {
    rule_id: 'TEST_001',
    rule: 'Test rule',
    severity: 'high',
    contract_types: ['NDA']
  };
  
  const result = validateRule(rule, 0);
  expect(result.isValid).toBe(true);
  expect(result.errors).toHaveLength(0);
});
```

## Console Commands (Browser DevTools)

```javascript
// Check rules in console
const { rules } = useLegalRules();
console.table(rules);

// Filter in console
const highRules = rules.filter(r => r.severity === 'high');
console.log('High severity:', highRules);

// Group by severity
const bySeverity = rules.reduce((acc, r) => {
  acc[r.severity] = (acc[r.severity] || 0) + 1;
  return acc;
}, {});
console.log('By severity:', bySeverity);
```

## Troubleshooting

### Rules not loading?
```javascript
const { isLoaded, isLoading, errors } = useLegalRules();
console.log({ isLoaded, isLoading, errors });
```

### Check validation errors
```javascript
const { hasErrors, errors } = useLegalRules();
if (hasErrors) {
  console.error('Validation errors:', errors);
}
```

### Verify file loaded
```javascript
fetch('/data/us-legal-rules.jsonc')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
```
