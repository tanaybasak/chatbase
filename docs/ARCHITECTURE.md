# Legal Rules Loader - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     US Legal Rules System                        │
│                         (Step 1)                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  DATA LAYER                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📄 public/data/us-legal-rules.jsonc                            │
│  ├─ metadata: { jurisdiction, version, contract_types }        │
│  └─ rules: [                                                    │
│       {                                                          │
│         rule_id: "US_LEGAL_001",           ✅ Required          │
│         category: "Obligations",                                │
│         rule: "Use 'shall' for...",        ✅ Required          │
│         severity: "high",                  ✅ Required          │
│         contract_types: ["NDA", "MSA"],   ✅ Required          │
│         bad_example: "...",                                     │
│         good_example: "..."                                     │
│       }                                                          │
│     ]                                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                        fetch('/data/...')
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  UTILITY LAYER                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📦 src/utils/rulesLoader.js                                    │
│                                                                  │
│  async fetchRulesData()                                         │
│  ├─ Fetch JSONC file                                           │
│  ├─ Strip // comments                                          │
│  ├─ Strip /* */ comments                                       │
│  └─ Parse JSON                                                 │
│                                                                  │
│  validateRule(rule, index)                                      │
│  ├─ Check rule_id exists & is string                           │
│  ├─ Check rule exists & is string                              │
│  ├─ Check severity in ['low','medium','high']                  │
│  ├─ Check contract_types is non-empty array                    │
│  └─ Return { isValid, errors }                                 │
│                                                                  │
│  async loadLegalRules()                                         │
│  ├─ Call fetchRulesData()                                      │
│  ├─ Validate each rule                                         │
│  ├─ Collect valid rules                                        │
│  ├─ Collect validation errors                                  │
│  └─ Return {                                                   │
│       success: boolean,                                         │
│       rules: Array<Rule>,                                       │
│       metadata: Object,                                         │
│       errors: Array<string>,                                    │
│       stats: { total, valid, invalid }                         │
│     }                                                            │
│                                                                  │
│  Helper Functions:                                              │
│  ├─ getRulesBySeverity(rules, severity)                        │
│  ├─ getRulesByContractType(rules, type)                        │
│  ├─ getRulesByCategory(rules, category)                        │
│  └─ getRuleById(rules, id)                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                      Returns validated rules
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  HOOK LAYER                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🪝 src/hooks/useLegalRules.js                                  │
│                                                                  │
│  useLegalRules()                                                │
│  ├─ useState({ rules, metadata, isLoaded, ... })               │
│  ├─ useEffect(() => {                                          │
│  │    loadRules()                                              │
│  │    ├─ Set isLoading = true                                 │
│  │    ├─ await loadLegalRules()                               │
│  │    ├─ Update state with result                             │
│  │    └─ Console log results                                  │
│  │  }, [])                                                     │
│  └─ Return {                                                   │
│       rules: Array<Rule>,        // Validated rules            │
│       metadata: Object,           // Dataset info              │
│       isLoaded: boolean,          // Load complete             │
│       isLoading: boolean,         // Currently loading         │
│       errors: Array<string>,      // Validation errors         │
│       stats: Object,              // { total, valid, invalid }  │
│       hasErrors: boolean,         // Any errors?               │
│       isValid: boolean,           // All valid?                │
│       totalRules: number,         // Count                     │
│       filterBySeverity: fn,       // Filter helper             │
│       filterByContractType: fn,   // Filter helper             │
│       filterByCategory: fn,       // Filter helper             │
│       findRuleById: fn            // Find helper               │
│     }                                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                     Used by React components
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  COMPONENT LAYER                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📱 src/components/LegalRulesTest/LegalRulesTest.jsx            │
│                                                                  │
│  LegalRulesTest()                                               │
│  ├─ const { rules, isLoaded, stats, ... } = useLegalRules()   │
│  ├─ Display loading state                                      │
│  ├─ Display validation status                                  │
│  ├─ Show metadata (jurisdiction, version)                      │
│  ├─ Show statistics (total, valid, invalid)                    │
│  ├─ Show severity breakdown (high/medium/low)                  │
│  ├─ Show contract type coverage (NDA/MSA)                      │
│  ├─ List all rules with details                               │
│  └─ Show validation errors (if any)                           │
│                                                                  │
│  Access: http://localhost:3000/?view=rules-test                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

## Data Flow Diagram

```
User Opens App
     ↓
Component Mounts
     ↓
useLegalRules() hook runs
     ↓
useEffect triggered
     ↓
loadLegalRules() called
     ↓
fetchRulesData() fetches JSONC
     ↓
Strip comments from JSONC
     ↓
Parse JSON
     ↓
Validate each rule
     ├─ Check rule_id ✅
     ├─ Check rule ✅
     ├─ Check severity ✅
     └─ Check contract_types ✅
     ↓
Collect valid rules
     ↓
Calculate statistics
     ↓
Return result object
     ↓
Hook updates state
     ↓
Console log results
     ↓
Component re-renders
     ↓
Display rules to user
```

## Validation Flow

```
For each rule in rules array:
  ↓
validateRule(rule, index)
  ↓
Check rule.rule_id
  ├─ Exists? → Continue
  └─ Missing? → Add error: "Missing required field 'rule_id'"
  ↓
Check rule.rule
  ├─ Exists? → Continue
  └─ Missing? → Add error: "Missing required field 'rule'"
  ↓
Check rule.severity
  ├─ In ['low','medium','high']? → Continue
  └─ Invalid? → Add error: "severity must be one of: low, medium, high"
  ↓
Check rule.contract_types
  ├─ Is array? → Continue
  ├─ Not array? → Add error: "contract_types must be an array"
  └─ Empty array? → Add error: "contract_types array cannot be empty"
  ↓
Return { isValid: errors.length === 0, errors }
  ↓
If isValid:
  ├─ Add to validatedRules array
  └─ Include in final result
Else:
  ├─ Skip rule
  └─ Add errors to validation log
```

## State Management

```javascript
// Initial State
{
  rules: [],
  metadata: null,
  isLoaded: false,
  isLoading: false,
  errors: [],
  stats: null
}

// Loading State
{
  rules: [],
  metadata: null,
  isLoaded: false,
  isLoading: true,    ← Changed
  errors: [],
  stats: null
}

// Success State
{
  rules: [/* 11 rules */],        ← Populated
  metadata: {/* ... */},           ← Populated
  isLoaded: true,                  ← Changed
  isLoading: false,                ← Changed
  errors: [],
  stats: {                         ← Populated
    total: 11,
    valid: 11,
    invalid: 0
  }
}

// Error State
{
  rules: [],
  metadata: null,
  isLoaded: true,                  ← Changed
  isLoading: false,                ← Changed
  errors: ['Error message'],       ← Populated
  stats: null
}
```

## Performance Profile

```
Timeline:
  0ms: Component mounts
  1ms: useEffect triggers
  2ms: loadLegalRules() starts
  3ms: fetch('/data/us-legal-rules.jsonc') sent
  30ms: Response received (network)
  31ms: Strip comments
  32ms: Parse JSON
  33ms: Validate 11 rules (O(n))
  34ms: Calculate stats
  35ms: Update state
  36ms: Console.log
  37ms: Component re-renders
  
Total: ~35-50ms
Memory: ~20KB
```

## Error Handling

```
Try-Catch Structure:

loadLegalRules()
├─ try {
│   ├─ fetchRulesData()
│   │   ├─ try { fetch() }
│   │   └─ catch { throw error }
│   ├─ Validate rules
│   └─ Return success
│  }
└─ catch {
    └─ Return { success: false, errors: [...] }
  }

Hook Layer:
├─ try {
│   ├─ await loadLegalRules()
│   └─ Update state with result
│  }
└─ catch {
    └─ Update state with error
  }
```

## Console Output Examples

**Success:**
```
✅ Legal rules loaded successfully: { total: 11, valid: 11, invalid: 0 }
```

**Partial Success:**
```
❌ Legal rules validation failed: [
  'Rule at index 3: Missing required field rule_id',
  'Rule at index 7: severity must be one of: low, medium, high'
]
```

**Complete Failure:**
```
❌ Error loading legal rules: Failed to fetch
```
