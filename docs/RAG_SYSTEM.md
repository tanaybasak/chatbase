# Legal Rules RAG System

## Overview

This document describes the Retrieval-Augmented Generation (RAG) system for legal contract drafting assistance integrated into the Chatbase application.

## Architecture

### Components

1. **Rules Dataset** (`data/us-legal-rules.jsonc`)
   - 55+ legal drafting rules covering US contract law
   - Categories: Obligations, Definitions, Termination, Indemnity, Liability, etc.
   - Metadata: severity, contract types, examples

2. **Vector Embeddings** (`src/utils/embeddingsGenerator.js`)
   - OpenAI `text-embedding-3-small` model
   - 1536-dimensional vectors for semantic search
   - LocalStorage caching (7-day TTL)

3. **RAG Orchestrator** (`src/utils/legalRulesRAG.js`)
   - Singleton managing rules and embeddings
   - Semantic search via cosine similarity
   - Legacy static filtering for fallback

4. **React Integration** (`src/hooks/useLegalAssistant.js`)
   - Custom hook for ChatPanel integration
   - Query-based semantic search
   - Contract type detection

5. **Backend Integration** 
   - `netlify/functions/utils/legalSemanticSearch.js` - Serverless semantic search
   - `netlify/functions/chatkit-session.js` - ChatKit session creation with dynamic context

## Data Flow

### Client-Side (Preferred)

```
User Query
    ↓
useLegalAssistant Hook
    ↓
legalRulesRAG.searchRelevantRules(query, topK=5)
    ↓
generateEmbedding(query) → Vector[1536]
    ↓
cosineSimilarity(queryVector, ruleVectors[])
    ↓
Top 5 Most Relevant Rules (sorted by similarity)
    ↓
buildSemanticContext() → Formatted String
    ↓
ChatKit Session with Dynamic System Instructions
```

### Server-Side (Fallback)

```
ChatKit Session Request
    ↓
chatkit-session.js (Netlify Function)
    ↓
buildSemanticInstructions(query, maxRules=5)
    ↓
ensureEmbeddingsCache() → In-Memory Cache (1hr TTL)
    ↓
semanticSearch(query, rulesWithEmbeddings, topK=5)
    ↓
System Instructions with Top 5 Rules
    ↓
ChatKit Session Response
```

## Usage

### Basic Usage

```javascript
import { useLegalAssistant } from './hooks/useLegalAssistant';

function MyComponent({ documentContext }) {
  const { 
    isReady, 
    embeddingsReady,
    searchRules,
    getSemanticContext 
  } = useLegalAssistant(documentContext);

  // Search for relevant rules
  const handleSearch = async () => {
    const results = await searchRules("How should I handle payment terms?");
    console.log(results); // Top 10 relevant rules with similarity scores
  };

  // Get context for a query
  const getContext = async () => {
    const context = await getSemanticContext("Review my NDA for confidentiality issues");
    console.log(context); // Formatted context with top 5 rules
  };
}
```

### Contract Type Detection

The system automatically detects contract types from document text:

- **NDA**: Keywords like "non-disclosure", "confidential information"
- **MSA**: Keywords like "master service", "statement of work"
- **Employment**: Keywords like "employment", "employee"
- **Services**: Keywords like "services agreement", "contractor"
- **Purchase**: Keywords like "purchase order", "buyer", "seller"

### Semantic Search vs Static Filtering

| Feature | Semantic Search | Static Filtering |
|---------|----------------|------------------|
| **Speed** | ~500ms (first call) | Instant |
| **Accuracy** | High (contextual) | Medium (keyword-based) |
| **Scale** | Excellent (50+ rules) | Poor (10-20 max) |
| **Tokens** | Efficient (5 rules) | Wasteful (10+ rules) |
| **Cache** | LocalStorage (7 days) | N/A |

## Rule Format

### Source Format (JSONC)

```jsonc
{
  "rule_id": "US_LEGAL_036",
  "category": "Payment Terms",
  "rule": "Specify payment amounts, schedule, and method clearly.",
  "bad_example": "Pay as agreed.",
  "good_example": "Client shall pay Contractor a fee of ten thousand dollars ($10,000) within thirty (30) days of receipt of invoice.",
  "severity": "high",
  "contract_types": ["Services", "MSA", "Purchase"]
}
```

### Normalized Format (Internal)

```javascript
{
  id: "US_LEGAL_036",
  text: "Rule: Specify payment amounts... | Bad Example: Pay as agreed. | Good Example: Client shall pay...",
  metadata: {
    category: "Payment Terms",
    severity: "high",
    contract_types: ["Services", "MSA", "Purchase"]
  },
  embedding: [0.123, -0.456, ...] // 1536 dimensions
}
```

## Performance

### Benchmarks

- **Initial Load**: ~2-3 seconds (55 rules × embedding generation)
- **Cached Load**: ~100ms (load from localStorage)
- **Semantic Search**: ~200-300ms per query
- **Backend Search**: ~500ms (cold start), ~200ms (warm)

### Optimization Strategies

1. **Caching**: LocalStorage with 7-day TTL
2. **Batch Embeddings**: Process all rules in single API call
3. **In-Memory Cache**: Backend keeps embeddings for 1 hour
4. **Top-K Limiting**: Send only 5 most relevant rules (not all 55)
5. **Lazy Loading**: Generate embeddings in background after initial load

## Configuration

### Environment Variables

```bash
# Required for embeddings generation
REACT_APP_OPENAI_API_KEY=sk-...

# Required for ChatKit integration
REACT_APP_CHATKIT_WORKFLOW_ID=wkflw_...
```

### Files to Deploy

```
public/data/us-legal-rules.jsonc  # Rules dataset
src/utils/embeddingsGenerator.js   # Client-side embeddings
src/utils/legalRulesRAG.js         # RAG orchestrator
src/hooks/useLegalAssistant.js     # React integration
netlify/functions/utils/legalSemanticSearch.js  # Backend search
```

## Extending the System

### Adding New Rules

1. Edit `data/us-legal-rules.jsonc`
2. Add rule with proper structure
3. Copy to `public/data/us-legal-rules.jsonc`
4. Clear localStorage cache: `localStorage.removeItem('legal-rules-embeddings')`
5. Reload app to regenerate embeddings

### Adding New Categories

Update the rule structure with new `category` values. The system automatically handles new categories.

### Changing Models

To use a different embedding model:

```javascript
// In embeddingsGenerator.js
const EMBEDDING_MODEL = 'text-embedding-3-large'; // More accurate but slower
const EMBEDDING_DIMENSIONS = 3072; // Adjust dimensions
```

## Troubleshooting

### Embeddings Not Loading

- Check browser console for errors
- Verify `REACT_APP_OPENAI_API_KEY` is set
- Clear cache: `localStorage.removeItem('legal-rules-embeddings')`
- Check API quota/limits

### Slow Performance

- Embeddings cached? Check console for "Using cached embeddings"
- Too many rules? Reduce `topK` parameter
- API rate limits? Add delays between requests

### Inaccurate Results

- Query too vague? Make it more specific
- Rules outdated? Update `us-legal-rules.jsonc`
- Model mismatch? Regenerate embeddings after model change

## Future Enhancements

1. **Vector Database**: Move to Pinecone/Weaviate for large-scale deployment
2. **Hybrid Search**: Combine semantic + keyword + metadata filtering
3. **Query Expansion**: Use LLM to rephrase user queries for better matches
4. **Feedback Loop**: Track which rules are most helpful, prioritize them
5. **Multi-Jurisdiction**: Support EU, UK, and other legal systems
6. **Real-Time Updates**: Stream embeddings generation progress to UI
7. **Rule Versioning**: Track changes to rules over time

## References

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [RAG Best Practices](https://www.anthropic.com/index/retrieval-augmented-generation)
- [US Contract Law Principles](https://www.law.cornell.edu/wex/contract)

## License

Proprietary - Chatbase Legal Assistant
