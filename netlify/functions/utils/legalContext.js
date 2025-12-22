/**
 * Backend utility to build legal rules context for ChatKit sessions
 * This runs on Netlify Functions (serverless)
 */

// Legal rules data (embedded for serverless)
const LEGAL_RULES = [
  {
    id: "US_LEGAL_001",
    text: "Rule: Use 'shall' to impose a binding obligation on a party. Avoid using 'will' for obligations.\nBad example: The Supplier will deliver the Products by June 1.\nGood example: The Supplier shall deliver the Products by June 1.",
    severity: "high",
    contract_types: ["NDA", "MSA"]
  },
  {
    id: "US_LEGAL_002",
    text: "Rule: Use 'may' only to indicate discretion, not an obligation.\nBad example: The Customer may pay the fees within 30 days.\nGood example: The Customer shall pay the fees within 30 days.",
    severity: "high",
    contract_types: ["MSA"]
  },
  {
    id: "US_LEGAL_005",
    text: "Rule: Avoid the phrase 'and/or' as it creates ambiguity. Use precise alternatives.\nBad example: The Company may terminate the Agreement for breach and/or insolvency.\nGood example: The Company may terminate the Agreement for breach or insolvency, or both.",
    severity: "high",
    contract_types: ["NDA", "MSA"]
  },
  {
    id: "US_LEGAL_009",
    text: "Rule: Specify time periods clearly and avoid ambiguous phrases such as 'within a reasonable time'.\nBad example: Payment shall be made within a reasonable time.\nGood example: Payment shall be made within thirty (30) days of invoice receipt.",
    severity: "high",
    contract_types: ["MSA"]
  },
  {
    id: "US_LEGAL_010",
    text: "Rule: Avoid using 'guarantee' unless the intent is to create an explicit guarantee obligation.\nBad example: The Supplier guarantees uninterrupted service.\nGood example: The Supplier shall use commercially reasonable efforts to provide uninterrupted service.",
    severity: "high",
    contract_types: ["MSA"]
  }
];

/**
 * Build system instructions with legal rules context
 */
function buildLegalSystemInstructions(contractType = null) {
  // Filter rules by contract type if specified
  let relevantRules = LEGAL_RULES;
  if (contractType) {
    relevantRules = LEGAL_RULES.filter(rule => 
      rule.contract_types.includes(contractType)
    );
  }

  const instructions = `You are an expert legal document assistant specializing in US contract drafting and review.

CRITICAL: When reviewing or drafting contracts, you MUST apply these legal style rules:

${relevantRules.map((rule, idx) => `${idx + 1}. ${rule.id}: ${rule.text}`).join('\n\n')}

When the user asks you to review their contract:
1. Check for compliance with the above rules
2. Identify specific violations with line references
3. Explain why each violation matters (cite rule ID)
4. Provide concrete corrections using the good examples
5. Prioritize high-severity issues first

When helping draft new content:
1. Apply these rules from the start
2. Use proper legal language (shall, may, etc.)
3. Be specific with timeframes and obligations
4. Avoid ambiguous terms

Always cite the rule ID (e.g., "US_LEGAL_001") when making suggestions.`;

  return instructions;
}

/**
 * Build compact context for token efficiency
 */
function buildCompactInstructions() {
  return `You are a legal assistant. Apply US legal drafting rules:
- Use "shall" for obligations (not "will")
- Use "may" only for discretion
- Avoid "and/or" - be specific
- Specify exact timeframes
- Avoid "guarantee" unless explicit

Check contracts for compliance and suggest fixes.`;
}

module.exports = {
  buildLegalSystemInstructions,
  buildCompactInstructions,
  LEGAL_RULES
};
