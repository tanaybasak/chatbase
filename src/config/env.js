/**
 * Environment configuration
 * Centralizes all environment variables for the application
 */

const config = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    workflowId: process.env.REACT_APP_CHATKIT_WORKFLOW_ID,
  },

  // TinyMCE Configuration
  tinymce: {
    apiKey: process.env.REACT_APP_TINYMCE_API_KEY || 'no-api-key',
  },

  // Backend Configuration
  backend: {
    url: process.env.REACT_APP_BACKEND_URL || '',
  },

  // Feature Flags
  features: {
    enableAttachments: process.env.REACT_APP_ENABLE_ATTACHMENTS === 'true',
    enableFileUpload: process.env.REACT_APP_ENABLE_ATTACHMENTS === 'true',
  },
};

// Validation helper
export const validateConfig = () => {
  const errors = [];

  if (!config.openai.apiKey) {
    errors.push('REACT_APP_OPENAI_API_KEY is not set');
  }

  if (!config.openai.workflowId) {
    errors.push('REACT_APP_CHATKIT_WORKFLOW_ID is not set');
  }

  if (errors.length > 0) {
    console.warn('Configuration warnings:', errors);
  }

  return errors.length === 0;
};

export default config;
