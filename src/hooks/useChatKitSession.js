import { useChatKit } from '@openai/chatkit-react';
import { useCallback } from 'react';
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
      // Use Netlify function URL
      const url = backendUrl 
        ? `${backendUrl}/api/chatkit/session`
        : '/.netlify/functions/chatkit-session';
      
      const deviceId = getDeviceId();
      console.log('📡 Requesting ChatKit session for device:', deviceId);
      
      const response = await fetch(url, {
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ ChatKit session error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ ChatKit session created successfully');
      return data.client_secret;
    } catch (error) {
      console.error('❌ Error fetching client secret:', error);
      throw error;
    }
  }, [backendUrl, getDeviceId]);

  const chatKit = useChatKit({
    api: {
      getClientSecret: fetchClientSecret
    },
    composer: {
      attachments: {
        enabled: false
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
