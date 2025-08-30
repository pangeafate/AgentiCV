// CORS proxy helper for production
// This uses a public CORS proxy as a fallback when direct requests fail
import { isProduction as checkIsProduction } from '@/config/env';

export const fetchWithCORS = async (url, options = {}) => {
  // First, try direct request
  try {
    const response = await fetch(url, {
      ...options,
      mode: 'cors'
    });
    
    if (response.ok || response.status !== 0) {
      return response;
    }
  } catch (error) {
    console.log('Direct request failed, trying with CORS proxy:', error.message);
  }
  
  // If direct request fails, try with a CORS proxy
  const corsProxies = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?'
  ];
  
  for (const proxy of corsProxies) {
    try {
      const proxiedUrl = proxy + encodeURIComponent(url);
      console.log('Trying CORS proxy:', proxy);
      
      const response = await fetch(proxiedUrl, {
        ...options,
        headers: {
          ...options.headers,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (response.ok) {
        console.log('Success with CORS proxy:', proxy);
        return response;
      }
    } catch (error) {
      console.log('CORS proxy failed:', proxy, error.message);
      continue;
    }
  }
  
  // If all proxies fail, throw error
  throw new Error('Unable to complete request due to CORS restrictions. Please ensure the N8N webhook is configured to accept requests from ' + window.location.origin);
};

// Helper to check if we're in production
export const isProduction = () => {
  return checkIsProduction();
};