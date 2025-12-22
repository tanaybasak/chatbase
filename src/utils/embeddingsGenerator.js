/**
 * Embeddings Generator
 * Generates vector embeddings for legal rules using OpenAI's text-embedding-3-small model
 */

import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536; // Default for text-embedding-3-small

// Initialize OpenAI client
let openaiClient = null;

function getOpenAIClient() {
  if (!openaiClient && OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Required for client-side usage
    });
  }
  return openaiClient;
}

/**
 * Generate embedding for a single text
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector
 */
export async function generateEmbedding(text) {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.trim(),
      encoding_format: 'float'
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {string[]} texts - Array of texts to embed
 * @param {number} batchSize - Number of texts to process per API call (max 2048 for OpenAI)
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function generateEmbeddingsBatch(texts, batchSize = 100) {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  const embeddings = [];
  
  // Process in batches to avoid rate limits
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    
    try {
      const response = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch.map(text => text.trim()),
        encoding_format: 'float'
      });

      embeddings.push(...response.data.map(item => item.embedding));
      
      // Small delay to avoid rate limits
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error generating embeddings for batch ${i}-${i + batchSize}:`, error);
      throw error;
    }
  }

  return embeddings;
}

/**
 * Generate embeddings for normalized legal rules
 * @param {Array} normalizedRules - Array of normalized rule objects
 * @returns {Promise<Array>} - Rules with embeddings attached
 */
export async function generateRuleEmbeddings(normalizedRules) {
  console.log(`Generating embeddings for ${normalizedRules.length} rules...`);
  
  // Extract text from normalized rules
  const texts = normalizedRules.map(rule => rule.text);
  
  // Generate embeddings in batch
  const embeddings = await generateEmbeddingsBatch(texts);
  
  // Attach embeddings to rules
  const rulesWithEmbeddings = normalizedRules.map((rule, index) => ({
    ...rule,
    embedding: embeddings[index]
  }));

  console.log(`Successfully generated ${embeddings.length} embeddings`);
  
  return rulesWithEmbeddings;
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Cosine similarity score (0 to 1)
 */
export function cosineSimilarity(vecA, vecB) {
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
 * Find top K most similar rules to a query
 * @param {string} query - The search query
 * @param {Array} rulesWithEmbeddings - Rules with embedding vectors
 * @param {number} topK - Number of top results to return
 * @returns {Promise<Array>} - Top K rules with similarity scores
 */
export async function semanticSearch(query, rulesWithEmbeddings, topK = 5) {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  // Calculate similarity scores for all rules
  const rulesWithScores = rulesWithEmbeddings.map(rule => ({
    ...rule,
    similarityScore: cosineSimilarity(queryEmbedding, rule.embedding)
  }));

  // Sort by similarity score (descending) and take top K
  const topRules = rulesWithScores
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topK);

  return topRules;
}

/**
 * Cache embeddings to localStorage
 * @param {Array} rulesWithEmbeddings - Rules with embeddings
 * @param {string} version - Rules version for cache invalidation
 */
export function cacheEmbeddings(rulesWithEmbeddings, version = '2.0') {
  try {
    const cacheData = {
      version,
      timestamp: Date.now(),
      rules: rulesWithEmbeddings
    };
    
    localStorage.setItem('legal-rules-embeddings', JSON.stringify(cacheData));
    console.log(`Cached ${rulesWithEmbeddings.length} rule embeddings (v${version})`);
  } catch (error) {
    console.warn('Failed to cache embeddings:', error);
  }
}

/**
 * Load embeddings from localStorage cache
 * @param {string} version - Expected rules version
 * @returns {Array|null} - Cached rules with embeddings, or null if cache invalid
 */
export function loadCachedEmbeddings(version = '2.0') {
  try {
    const cached = localStorage.getItem('legal-rules-embeddings');
    
    if (!cached) {
      return null;
    }

    const cacheData = JSON.parse(cached);
    
    // Validate cache version
    if (cacheData.version !== version) {
      console.log(`Cache version mismatch: ${cacheData.version} vs ${version}`);
      return null;
    }

    // Check if cache is older than 7 days
    const cacheAge = Date.now() - cacheData.timestamp;
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    if (cacheAge > maxAge) {
      console.log('Cache expired (older than 7 days)');
      return null;
    }

    console.log(`Loaded ${cacheData.rules.length} cached embeddings (v${version})`);
    return cacheData.rules;
  } catch (error) {
    console.warn('Failed to load cached embeddings:', error);
    return null;
  }
}

export default {
  generateEmbedding,
  generateEmbeddingsBatch,
  generateRuleEmbeddings,
  cosineSimilarity,
  semanticSearch,
  cacheEmbeddings,
  loadCachedEmbeddings,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS
};
