import { useChatKit } from '@openai/chatkit-react';
import { useCallback, useEffect } from 'react';
import config from '../config/env';

/**
 * Custom hook for managing ChatKit session
 * @returns {Object} ChatKit control and configuration
 */
export const useChatKitSession = () => {
  const backendUrl = config.backend.url;

  // Get or create persistent device ID
  const getDeviceId = useCallback(() => {
    const storageKey = 'chatkit_device_id';
    let deviceId = localStorage.getItem(storageKey);
    
    if (!deviceId) {
      deviceId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, deviceId);
    }
    
    return deviceId;
  }, []);

  // Fetch client secret from backend
  const fetchClientSecret = useCallback(async (existing) => {
    if (existing) {
      return existing;
    }
    
    try {
      const deviceId = getDeviceId();
      console.log('📡 Requesting ChatKit session for device:', deviceId);
      
      // Try multiple endpoints for Vercel/Netlify compatibility (Vercel first)
      const endpoints = backendUrl 
        ? [`${backendUrl}/api/chatkit-session`]
        : ['/api/chatkit-session'];
      
      let response;
      let lastError;
      
      for (const url of endpoints) {
        try {
          console.log('🔄 Trying endpoint:', url, 'with method: POST');
          
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              deviceId,
              contractType: null,
              query: null,
              useSemanticSearch: false
            })
          });
          
          console.log('📨 Response received:', { url, status: response.status, statusText: response.statusText });
          
          if (response.ok) {
            console.log('✅ Connected to:', url);
            break;
          }
          
          // If 404, try next endpoint
          if (response.status === 404) {
            console.log('⏭️ Endpoint not found, trying next:', url);
            continue;
          }
          
          // If 405, log the allowed methods
          if (response.status === 405) {
            const allowedMethods = response.headers.get('Allow') || response.headers.get('Access-Control-Allow-Methods');
            console.error('❌ Method not allowed. Allowed methods:', allowedMethods);
            console.log('⏭️ Trying next endpoint:', url);
            continue; // Try the next endpoint instead of throwing
          }
          
          // For other errors, throw immediately
          const errorText = await response.text();
          console.error('❌ ChatKit session error:', response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        } catch (error) {
          lastError = error;
          if (error.message.includes('HTTP error')) {
            throw error;
          }
          console.log('⏭️ Failed to reach:', url, error.message);
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error('Failed to connect to any backend endpoint');
      }

      const data = await response.json();
      console.log('✅ ChatKit session created successfully');
      return data.client_secret;
    } catch (error) {
      console.error('❌ Error fetching client secret:', error);
      throw error;
    }
  }, [backendUrl, getDeviceId]);

  const { enableAttachments } = config.features;

  // Clear cached session data when attachment settings change
  useEffect(() => {
    const cacheKey = 'chatkit_attachment_setting';
    const cachedSetting = localStorage.getItem(cacheKey);
    
    if (cachedSetting !== String(enableAttachments)) {
      // Clear any ChatKit cached data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('chatkit_') && key !== 'chatkit_device_id') {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem(cacheKey, String(enableAttachments));
      console.log('🔄 Attachment setting changed, cleared cached session');
    }
  }, [enableAttachments]);

  const chatKit = useChatKit({
    api: {
      getClientSecret: fetchClientSecret
    },
    composer: {
      attachments: {
        enabled: enableAttachments
      }
    },
    header: {
      enabled: true
    },
    history: {
      enabled: false
    }
  });

  return { 
    control: chatKit.control,
    showHistory: chatKit.showHistory,
    hideHistory: chatKit.hideHistory,
    setThreadId: chatKit.setThreadId,
    sendUserMessage: chatKit.sendUserMessage
  };
};
