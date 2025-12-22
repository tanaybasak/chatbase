/**
 * Hook: useLegalAssistant
 * 
 * Integrates legal rules RAG with ChatKit for context-aware assistance
 * Uses semantic search to find relevant legal rules dynamically
 */

import { useState, useEffect, useCallback } from 'react';
import legalRulesRAG from '../utils/legalRulesRAG';

export function useLegalAssistant(documentContext = {}) {
  const [isReady, setIsReady] = useState(false);
  const [embeddingsReady, setEmbeddingsReady] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');

  // Initialize RAG on mount
  useEffect(() => {
    async function init() {
      try {
        setLoadingStatus('Loading legal rules...');
        const success = await legalRulesRAG.initialize(true); // Use cached embeddings
        
        setIsReady(success);
        setEmbeddingsReady(legalRulesRAG.embeddingsReady);
        
        if (!success) {
          setError('Failed to load legal rules');
          setLoadingStatus('Failed');
        } else if (!legalRulesRAG.embeddingsReady) {
          setLoadingStatus('Rules loaded (generating embeddings in background)');
        } else {
          setLoadingStatus('Ready');
        }
      } catch (err) {
        setError(err.message);
        setIsReady(false);
        setLoadingStatus('Error');
      }
    }

    if (!legalRulesRAG.isLoaded) {
      init();
    } else {
      setIsReady(true);
      setEmbeddingsReady(legalRulesRAG.embeddingsReady);
      setLoadingStatus('Ready');
    }
  }, []);

  /**
   * Get semantically relevant context based on user query
   * @param {string} query - User's question or document excerpt
   */
  const getSemanticContext = useCallback(async (query) => {
    if (!isReady) return '';
    
    if (!embeddingsReady) {
      // Fallback to static filtering if embeddings not ready
      console.warn('⚠️ Using static context (embeddings not ready)');
      return getDocumentContext();
    }

    try {
      return await legalRulesRAG.buildSemanticContext(query, 5);
    } catch (err) {
      console.error('Error getting semantic context:', err);
      return getDocumentContext(); // Fallback
    }
  }, [isReady, embeddingsReady]);

  /**
   * Get relevant context for the current document (static filtering - legacy)
   */
  const getDocumentContext = useCallback(() => {
    if (!isReady) return '';

    // Detect contract type from document
    const contractType = detectContractType(documentContext);
    
    const context = {
      contractType,
      severity: 'high' // Prioritize high-severity rules
    };

    return legalRulesRAG.buildChatContext(context, 10);
  }, [isReady, documentContext]);

  /**
   * Get compact context (token-efficient)
   */
  const getCompactContext = useCallback(() => {
    if (!isReady) return '';

    const contractType = detectContractType(documentContext);
    
    return legalRulesRAG.buildCompactContext({ contractType }, 10);
  }, [isReady, documentContext]);

  /**
   * Search for specific rules using semantic search
   */
  const searchRules = useCallback(async (query) => {
    if (!isReady) return [];
    
    if (!embeddingsReady) {
      // Fallback to keyword search
      return legalRulesRAG.searchRules(query);
    }

    try {
      return await legalRulesRAG.searchRelevantRules(query, 10);
    } catch (err) {
      console.error('Error searching rules:', err);
      return legalRulesRAG.searchRules(query); // Fallback
    }
  }, [isReady, embeddingsReady]);

  /**
   * Get rules for specific contract type
   */
  const getRulesForContract = useCallback((contractType) => {
    if (!isReady) return [];
    return legalRulesRAG.getRulesForContractType(contractType);
  }, [isReady]);

  /**
   * Build system message with legal context using semantic search
   */
  const buildSystemMessage = useCallback(async (userQuery = '') => {
    if (!isReady) {
      return 'You are a legal document assistant.';
    }

    // If embeddings are ready and we have a query, use semantic search
    if (embeddingsReady && userQuery) {
      try {
        const relevantRules = await legalRulesRAG.searchRelevantRules(userQuery, 5);
        
        const systemMessage = `You are a legal document assistant specializing in US contract drafting.

IMPORTANT: Apply these legal style rules when reviewing or drafting:

${relevantRules.map((rule, idx) => {
  const relevance = (rule.similarityScore * 100).toFixed(1);
  return `${idx + 1}. [${rule.id}, ${relevance}% relevant] ${rule.text}`;
}).join('\n\n')}

When the user asks you to review their contract or help with drafting:
- Check for compliance with these rules
- Point out violations with specific examples
- Suggest corrections using the good examples
- Prioritize high-severity issues first

Always be specific and cite the rule ID when making suggestions.`;

        return systemMessage;
      } catch (err) {
        console.error('Error building semantic system message:', err);
        // Fall through to static method
      }
    }

    // Fallback to static filtering by contract type
    const contractType = detectContractType(documentContext);
    const relevantRules = legalRulesRAG.getRelevantRules({ 
      contractType, 
      severity: 'high' 
    });

    const systemMessage = `You are a legal document assistant specializing in US contract drafting.

IMPORTANT: Apply these legal style rules when reviewing or drafting:

${relevantRules.slice(0, 5).map((rule, idx) => 
  `${idx + 1}. ${rule.text}`
).join('\n\n')}

When the user asks you to review their contract or help with drafting:
- Check for compliance with these rules
- Point out violations with specific examples
- Suggest corrections using the good examples
- Prioritize high-severity issues first

Always be specific and cite the rule ID when making suggestions.`;

    return systemMessage;
  }, [isReady, embeddingsReady, documentContext]);

  return {
    isReady,
    embeddingsReady,
    error,
    loadingStatus,
    getSemanticContext,
    getDocumentContext,
    getCompactContext,
    searchRules,
    getRulesForContract,
    buildSystemMessage,
    stats: legalRulesRAG.getStats()
  };
}

/**
 * Detect contract type from document context
 */
function detectContractType(context) {
  if (!context || !context.documentText) {
    return null;
  }

  const text = context.documentText.toLowerCase();
  
  // Simple keyword-based detection
  if (text.includes('non-disclosure') || text.includes('confidential information')) {
    return 'NDA';
  }
  
  if (text.includes('master service') || text.includes('statement of work')) {
    return 'MSA';
  }

  if (text.includes('employment') || text.includes('employee')) {
    return 'Employment';
  }

  if (text.includes('purchase order') || text.includes('buyer') || text.includes('seller')) {
    return 'Purchase';
  }

  if (text.includes('services agreement') || text.includes('contractor')) {
    return 'Services';
  }
  
  // Default to general if taskType is available
  if (context.taskType) {
    const taskTypeLower = context.taskType.toLowerCase();
    if (taskTypeLower.includes('nda')) return 'NDA';
    if (taskTypeLower.includes('msa')) return 'MSA';
    if (taskTypeLower.includes('employment')) return 'Employment';
    if (taskTypeLower.includes('purchase')) return 'Purchase';
    if (taskTypeLower.includes('services')) return 'Services';
  }
  
  return null;
}

export default useLegalAssistant;
