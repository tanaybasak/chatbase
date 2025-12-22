/**
 * Legal Semantic Search for Serverless Functions
 * 
 * Provides semantic search capabilities for legal rules in Netlify Functions.
 * Uses OpenAI embeddings API to find contextually relevant rules.
 */

const OpenAI = require('openai');

const EMBEDDING_MODEL = 'text-embedding-3-small';

// In-memory cache for embeddings (will persist during function warm state)
let embeddingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 3600000; // 1 hour

/**
 * Get OpenAI client
 */
function getOpenAIClient() {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('REACT_APP_OPENAI_API_KEY not configured');
  }
  
  return new OpenAI({ apiKey });
}

/**
 * Generate embedding for a text
 */
async function generateEmbedding(text) {
  const client = getOpenAIClient();
  
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.trim(),
    encoding_format: 'float'
  });

  return response.data[0].embedding;
}

/**
 * Calculate cosine similarity
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Load and parse rules from JSONC file
 */
function loadRulesData() {
  const fs = require('fs');
  const path = require('path');
  
  // Try multiple possible paths for Netlify deployment
  const possiblePaths = [
    path.join(__dirname, '../../../data/us-legal-rules.jsonc'),
    path.join(__dirname, '../../../public/data/us-legal-rules.jsonc'),
    path.join(process.cwd(), 'data/us-legal-rules.jsonc'),
    path.join(process.cwd(), 'public/data/us-legal-rules.jsonc')
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      // Remove comments from JSONC
      const jsonContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      return JSON.parse(jsonContent);
    }
  }

  throw new Error('Legal rules file not found');
}

/**
 * Normalize a single rule for embedding
 */
function normalizeRule(rule) {
  const parts = [
    `Rule: ${rule.rule}`,
    `Category: ${rule.category}`,
    `Bad Example: ${rule.bad_example}`,
    `Good Example: ${rule.good_example}`
  ];

  return {
    id: rule.rule_id,
    text: parts.join(' | '),
    metadata: {
      category: rule.category,
      severity: rule.severity,
      contract_types: rule.contract_types
    }
  };
}

/**
 * Initialize embeddings cache if needed
 */
async function ensureEmbeddingsCache() {
  const now = Date.now();
  
  // Check if cache is valid
  if (embeddingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    console.log('✅ Using cached embeddings');
    return embeddingsCache;
  }

  console.log('🔄 Generating fresh embeddings...');
  
  // Load rules
  const rulesData = loadRulesData();
  const normalizedRules = rulesData.rules.map(normalizeRule);
  
  // Generate embeddings for all rules
  const client = getOpenAIClient();
  const texts = normalizedRules.map(r => r.text);
  
  // Batch request to OpenAI
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    encoding_format: 'float'
  });

  const embeddings = response.data.map(item => item.embedding);
  
  // Combine rules with embeddings
  const rulesWithEmbeddings = normalizedRules.map((rule, index) => ({
    ...rule,
    embedding: embeddings[index]
  }));

  // Update cache
  embeddingsCache = rulesWithEmbeddings;
  cacheTimestamp = now;
  
  console.log(`✅ Generated ${rulesWithEmbeddings.length} embeddings`);
  
  return rulesWithEmbeddings;
}

/**
 * Semantic search for relevant rules
 * @param {string} query - User's question or context
 * @param {number} topK - Number of top results
 * @returns {Promise<Array>} Relevant rules with similarity scores
 */
async function searchRelevantRules(query, topK = 5) {
  try {
    // Ensure embeddings are cached
    const rulesWithEmbeddings = await ensureEmbeddingsCache();
    
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);
    
    // Calculate similarity scores
    const rulesWithScores = rulesWithEmbeddings.map(rule => ({
      ...rule,
      similarityScore: cosineSimilarity(queryEmbedding, rule.embedding)
    }));

    // Sort by similarity and take top K
    const topRules = rulesWithScores
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, topK);

    console.log(`🔍 Found ${topRules.length} relevant rules for query: "${query.substring(0, 50)}..."`);
    
    return topRules;
  } catch (error) {
    console.error('❌ Error in semantic search:', error);
    throw error;
  }
}

/**
 * Build system instructions with semantically relevant rules
 * @param {string} query - User's query or document context
 * @param {number} maxRules - Maximum number of rules to include
 * @returns {Promise<string>} Formatted system instructions
 */
async function buildSemanticInstructions(query, maxRules = 5) {
  try {
    const relevantRules = await searchRelevantRules(query, maxRules);
    
    const instructions = `You are a legal document assistant specializing in US contract drafting.

IMPORTANT: Apply these legal style rules when reviewing or drafting:

${relevantRules.map((rule, idx) => {
  const relevance = (rule.similarityScore * 100).toFixed(1);
  return `${idx + 1}. [${rule.id}, ${relevance}% relevant]
   ${rule.text}
   Severity: ${rule.metadata.severity}
   Applies to: ${rule.metadata.contract_types.join(', ')}`;
}).join('\n\n')}

When the user asks you to review their contract or help with drafting:
- Check for compliance with these rules
- Point out violations with specific examples
- Suggest corrections
- Prioritize high-severity issues first

Always cite the rule ID when making suggestions.`;

    return instructions;
  } catch (error) {
    console.error('❌ Error building semantic instructions:', error);
    // Fallback to basic instructions
    return 'You are a legal document assistant specializing in US contract drafting. Help users draft and review contracts according to legal best practices.';
  }
}

module.exports = {
  searchRelevantRules,
  buildSemanticInstructions,
  generateEmbedding,
  cosineSimilarity
};
