/**
 * Legal Rules RAG Context
 * 
 * Provides normalized legal rules with vector embeddings for semantic search.
 * Uses OpenAI embeddings for finding contextually relevant legal drafting rules.
 */

import { loadLegalRules } from './rulesLoader';
import { normalizeAllRules, filterNormalizedRules } from './rulesNormalizer';
import { 
  generateRuleEmbeddings, 
  semanticSearch,
  cacheEmbeddings,
  loadCachedEmbeddings
} from './embeddingsGenerator';

class LegalRulesRAG {
  constructor() {
    this.rules = [];
    this.normalizedRules = [];
    this.rulesWithEmbeddings = [];
    this.isLoaded = false;
    this.embeddingsReady = false;
    this.metadata = null;
  }

  /**
   * Initialize and load rules with embeddings
   * @param {boolean} useCache - Whether to use cached embeddings (default: true)
   */
  async initialize(useCache = true) {
    try {
      const result = await loadLegalRules();
      
      if (!result.success) {
        console.error('❌ Failed to load legal rules:', result.errors);
        return false;
      }

      this.rules = result.rules;
      this.normalizedRules = normalizeAllRules(result);
      this.metadata = result.metadata;
      this.isLoaded = true;

      console.log('✅ Legal rules loaded:', {
        rules: this.normalizedRules.length,
        jurisdiction: this.metadata?.jurisdiction,
        version: this.metadata?.version
      });

      // Try to load cached embeddings
      if (useCache) {
        const cached = loadCachedEmbeddings(this.metadata?.version);
        if (cached && cached.length === this.normalizedRules.length) {
          this.rulesWithEmbeddings = cached;
          this.embeddingsReady = true;
          console.log('✅ Using cached embeddings');
          return true;
        }
      }

      // Generate new embeddings
      await this.generateEmbeddings();
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing Legal RAG:', error);
      return false;
    }
  }

  /**
   * Generate and cache embeddings for all rules
   */
  async generateEmbeddings() {
    try {
      console.log('🔄 Generating embeddings for legal rules...');
      
      this.rulesWithEmbeddings = await generateRuleEmbeddings(this.normalizedRules);
      this.embeddingsReady = true;
      
      // Cache the embeddings
      cacheEmbeddings(this.rulesWithEmbeddings, this.metadata?.version);
      
      console.log('✅ Embeddings generated and cached');
      return true;
    } catch (error) {
      console.error('❌ Error generating embeddings:', error);
      this.embeddingsReady = false;
      return false;
    }
  }

  /**
   * Semantic search for relevant rules using vector similarity
   * @param {string} query - User's question or context
   * @param {number} topK - Number of top results to return
   * @returns {Promise<Array>} Most relevant rules with similarity scores
   */
  async searchRelevantRules(query, topK = 5) {
    if (!this.embeddingsReady) {
      console.warn('⚠️ Embeddings not ready, falling back to keyword search');
      return this.searchRules(query).slice(0, topK);
    }

    try {
      const results = await semanticSearch(query, this.rulesWithEmbeddings, topK);
      console.log(`🔍 Found ${results.length} relevant rules for: "${query.substring(0, 50)}..."`);
      return results;
    } catch (error) {
      console.error('❌ Error in semantic search:', error);
      return [];
    }
  }

  /**
   * Get relevant rules based on document context (legacy method - kept for compatibility)
   * @param {Object} context - Document context (language, taskType, etc.)
   * @returns {Array} Relevant normalized rules
   */
  getRelevantRules(context = {}) {
    if (!this.isLoaded) {
      return [];
    }

    let relevantRules = [...this.normalizedRules];

    // Filter by contract type if specified
    if (context.contractType) {
      relevantRules = filterNormalizedRules(relevantRules, {
        contractType: context.contractType
      });
    }

    // Filter by severity - prioritize high severity
    if (context.severity) {
      relevantRules = filterNormalizedRules(relevantRules, {
        severity: context.severity
      });
    } else {
      // Default: get high and medium severity rules
      const high = filterNormalizedRules(relevantRules, { severity: 'high' });
      const medium = filterNormalizedRules(relevantRules, { severity: 'medium' });
      relevantRules = [...high, ...medium];
    }

    // Filter by category if specified
    if (context.category) {
      relevantRules = filterNormalizedRules(relevantRules, {
        category: context.category
      });
    }

    return relevantRules;
  }

  /**
   * Get rules for specific contract type (NDA, MSA, etc.)
   * @param {string} contractType - Contract type
   * @returns {Array} Filtered rules
   */
  getRulesForContractType(contractType) {
    return this.getRelevantRules({ contractType });
  }

  /**
   * Get high priority rules
   * @returns {Array} High severity rules
   */
  getHighPriorityRules() {
    return this.getRelevantRules({ severity: 'high' });
  }

  /**
   * Build RAG context string for ChatKit using semantic search
   * @param {string} query - User's query or document context
   * @param {number} maxRules - Maximum number of rules to include
   * @returns {Promise<string>} Formatted context string
   */
  async buildSemanticContext(query, maxRules = 5) {
    const relevantRules = await this.searchRelevantRules(query, maxRules);

    if (relevantRules.length === 0) {
      return '';
    }

    const contextParts = [
      '# Legal Drafting Guidelines',
      '',
      `Jurisdiction: ${this.metadata?.jurisdiction || 'US'}`,
      `Version: ${this.metadata?.version || '1.0'}`,
      '',
      'Apply the following legal style rules when reviewing or drafting contracts:',
      ''
    ];

    relevantRules.forEach((rule, index) => {
      const relevancePercent = (rule.similarityScore * 100).toFixed(1);
      
      contextParts.push(`## Rule ${index + 1}: ${rule.id} (${relevancePercent}% relevant)`);
      contextParts.push('');
      contextParts.push(rule.text);
      contextParts.push('');
      contextParts.push(`**Severity:** ${rule.metadata.severity}`);
      contextParts.push(`**Applies to:** ${rule.metadata.contract_types.join(', ')}`);
      if (rule.metadata.category) {
        contextParts.push(`**Category:** ${rule.metadata.category}`);
      }
      contextParts.push('');
      contextParts.push('---');
      contextParts.push('');
    });

    return contextParts.join('\n');
  }

  /**
   * Build RAG context string for ChatKit (legacy - static filtering)
   * @param {Object} context - Document context
   * @param {number} maxRules - Maximum number of rules to include
   * @returns {string} Formatted context string
   */
  buildChatContext(context = {}, maxRules = 10) {
    const relevantRules = this.getRelevantRules(context).slice(0, maxRules);

    if (relevantRules.length === 0) {
      return '';
    }

    const contextParts = [
      '# Legal Drafting Guidelines',
      '',
      `Jurisdiction: ${this.metadata?.jurisdiction || 'US'}`,
      '',
      'Apply the following legal style rules when reviewing or drafting contracts:',
      ''
    ];

    relevantRules.forEach((rule, index) => {
      contextParts.push(`## Rule ${index + 1}: ${rule.id}`);
      contextParts.push('');
      contextParts.push(rule.text);
      contextParts.push('');
      contextParts.push(`**Severity:** ${rule.metadata.severity}`);
      contextParts.push(`**Applies to:** ${rule.metadata.contract_types.join(', ')}`);
      if (rule.metadata.category) {
        contextParts.push(`**Category:** ${rule.metadata.category}`);
      }
      contextParts.push('');
      contextParts.push('---');
      contextParts.push('');
    });

    return contextParts.join('\n');
  }

  /**
   * Build compact context for token efficiency using semantic search
   * @param {string} query - User's query or document context
   * @param {number} maxRules - Maximum number of rules
   * @returns {Promise<string>} Compact context string
   */
  async buildCompactSemanticContext(query, maxRules = 5) {
    const relevantRules = await this.searchRelevantRules(query, maxRules);

    if (relevantRules.length === 0) {
      return '';
    }

    const contextParts = ['Legal Style Rules:'];

    relevantRules.forEach((rule) => {
      contextParts.push(`- ${rule.id}: ${rule.text}`);
    });

    return contextParts.join('\n');
  }

  /**
   * Build compact context for token efficiency (legacy)
   * @param {Object} context - Document context
   * @param {number} maxRules - Maximum number of rules
   * @returns {string} Compact context string
   */
  buildCompactContext(context = {}, maxRules = 10) {
    const relevantRules = this.getRelevantRules(context).slice(0, maxRules);

    if (relevantRules.length === 0) {
      return '';
    }

    const contextParts = ['Legal Style Rules:'];

    relevantRules.forEach((rule) => {
      contextParts.push(`- ${rule.id}: ${rule.text}`);
    });

    return contextParts.join('\n');
  }

  /**
   * Search rules by text content
   * @param {string} query - Search query
   * @returns {Array} Matching rules
   */
  searchRules(query) {
    if (!this.isLoaded || !query) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return this.normalizedRules.filter(rule =>
      rule.text.toLowerCase().includes(lowerQuery) ||
      rule.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get all normalized rules (for export or vector DB)
   * @returns {Array} All normalized rules
   */
  getAllNormalizedRules() {
    return this.normalizedRules;
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      total: this.normalizedRules.length,
      isLoaded: this.isLoaded,
      jurisdiction: this.metadata?.jurisdiction,
      contractTypes: this.metadata?.supported_contract_types
    };
  }
}

// Singleton instance
const legalRulesRAG = new LegalRulesRAG();

export default legalRulesRAG;
