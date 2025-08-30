import React, { useState } from 'react';
import { env, isProduction, shouldUseProxy } from '@/config/env';

const AnalysisControl = ({ 
  cvReady, 
  jdReady, 
  sessionId, 
  cvUrl, 
  jobDescription,
  onAnalysisComplete 
}) => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const canAnalyze = cvReady && jdReady && status !== 'analyzing';

  const performAnalysis = async () => {
    setStatus('analyzing');
    setError(null);
    setProgress(0);

    try {
      // Single call to complete analysis workflow
      setStatus('analyzing');
      setProgress(50);
      
      // Call the main analysis endpoint with both CV and JD
      // Use proxy if configured, otherwise direct webhook
      const useProxy = shouldUseProxy();
      let apiUrl = useProxy
        ? `${env.VITE_PROXY_SERVER_URL}/api/n8n/analyze-complete`
        : env.VITE_N8N_COMPLETE_ANALYSIS_URL;
      
      // CRITICAL: Detect malformed URL from GitHub secrets
      if (apiUrl && (apiUrl.includes('--body') || apiUrl.includes('"') || apiUrl.includes('\n'))) {
        console.error('🚨 CRITICAL ERROR: Malformed N8N webhook URL detected!');
        console.error('Current value:', JSON.stringify(apiUrl));
        console.error('The GitHub secret VITE_N8N_COMPLETE_ANALYSIS_URL contains invalid characters.');
        console.error('It should be ONLY the URL: https://n8n.lakestrom.com/webhook/get_cvjd');
        console.error('Please fix the GitHub secret by removing quotes, --body prefix, and newlines.');
        
        // Try to extract the actual URL
        const urlMatch = apiUrl.match(/https?:\/\/[^\s"]+/);
        if (urlMatch) {
          const cleanUrl = urlMatch[0];
          console.warn('🔧 Attempting to use cleaned URL:', cleanUrl);
          apiUrl = cleanUrl;
        } else {
          throw new Error('Invalid N8N webhook URL. Please fix the VITE_N8N_COMPLETE_ANALYSIS_URL GitHub secret to contain ONLY: https://n8n.lakestrom.com/webhook/get_cvjd');
        }
      }
      
      console.log(`Using ${useProxy ? 'proxy' : 'direct webhook'} API:`, apiUrl);
      console.log('Configuration:', { isProduction: isProduction(), useProxy, apiUrl });
      
      const fetchOptions = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId, 
          cvUrl,           // URL to the CV file
          jobDescription   // JD text
        })
      };
      
      // Set CORS mode for direct webhook calls
      if (!useProxy) {
        fetchOptions.mode = 'cors';
      }
      
      let response;
      try {
        console.log('🔄 Attempting to fetch from:', apiUrl);
        console.log('📦 Request payload:', JSON.stringify({ sessionId, cvUrl, jobDescription }, null, 2));
        console.log('🔧 Fetch options:', {
          method: fetchOptions.method,
          headers: fetchOptions.headers,
          mode: fetchOptions.mode,
          bodyLength: fetchOptions.body?.length
        });
        
        response = await fetch(apiUrl, fetchOptions);
        
        console.log('📡 Response received:', {
          status: response.status,
          statusText: response.statusText,
          type: response.type,
          headers: Object.fromEntries(response.headers.entries()),
          url: response.url
        });
      } catch (fetchError) {
        // Network-level errors (no internet, server unreachable, etc.)
        console.error('❌ Fetch error details:', {
          name: fetchError.name,
          message: fetchError.message,
          stack: fetchError.stack,
          apiUrl: apiUrl,
          useProxy: useProxy,
          origin: window.location.origin
        });
        if (fetchError.name === 'TypeError' && fetchError.message.includes('fetch')) {
          throw new Error(`Network error: Unable to connect to ${useProxy ? 'proxy server' : 'N8N webhook'}. Please check your internet connection and try again.`);
        }
        throw new Error(`Connection failed: ${fetchError.message}`);
      }

      setProgress(80);

      if (!response.ok) {
        // Enhanced CORS error detection
        console.error('⚠️ Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          type: response.type,
          url: response.url,
          redirected: response.redirected,
          isCORSLikelyIssue: response.type === 'opaque' || response.status === 0 || 
                             (response.status === 400 && response.statusText === '') ||
                             response.type === 'error'
        });
        
        if (response.type === 'opaque' || response.status === 0 || 
            (response.status === 400 && response.statusText === '') ||
            response.type === 'error') {
          const corsErrorMsg = useProxy 
            ? `CORS error: Unable to reach the proxy server at ${env.VITE_PROXY_SERVER_URL}. Please ensure the proxy server is running and accessible.`
            : `CORS error: The N8N webhook at ${env.VITE_N8N_COMPLETE_ANALYSIS_URL} is not configured to accept requests from this domain (${window.location.origin}). This is common when running from GitHub Pages. You can enable proxy mode by setting VITE_USE_PROXY_IN_PROD=true in your environment.`;
          console.error('🚫 CORS Error Detected:', corsErrorMsg);
          throw new Error(corsErrorMsg);
        }
        
        console.error('❌ HTTP Error:', `${response.status} ${response.statusText}`);
        throw new Error(`Failed to analyze CV and JD: ${response.status} ${response.statusText}`);
      }

      let analysisData;
      try {
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        analysisData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error('Invalid response from N8N webhook. Please check the webhook configuration.');
      }
      console.log('Raw N8N Analysis response:', analysisData);
      
      // Check if the response contains an N8N error (webhook not registered, etc.)
      if (analysisData && (analysisData.code === 404 || analysisData.code === 500)) {
        const errorMessage = analysisData.message || 'N8N service error';
        const isWebhookError = errorMessage.includes('webhook') && errorMessage.includes('not registered');
        
        if (isWebhookError) {
          throw new Error('N8N_WEBHOOK_NOT_ACTIVE: The analysis workflow is not active. Please activate your N8N workflow and try again.');
        } else {
          throw new Error(`N8N_ERROR: ${errorMessage}`);
        }
      }
      
      // Extract and parse the actual data from n8n response structure
      let processedData = null;
      
      try {
        // If response is wrapped in array from n8n
        let responseData = Array.isArray(analysisData) && analysisData.length > 0 
          ? analysisData[0] 
          : analysisData;
        
        console.log('Extracted response data:', responseData);
        
        // If response has an output property (from n8n agent), parse the stringified JSON
        if (responseData.output) {
          let parsedOutput;
          if (typeof responseData.output === 'string') {
            parsedOutput = JSON.parse(responseData.output);
            console.log('Parsed JSON output:', parsedOutput);
          } else {
            parsedOutput = responseData.output;
          }
          
          // Structure the data according to what GapAnalysisResults expects
          // NEVER create fake/placeholder data - require valid response from N8N
          if (!parsedOutput.cv_highlighting || !parsedOutput.jd_highlighting || !parsedOutput.match_score) {
            throw new Error('Invalid N8N response: Missing required analysis data (cv_highlighting, jd_highlighting, or match_score)');
          }
          
          processedData = {
            cvData: parsedOutput.cv_content || null, // Use actual CV content from N8N response
            jdData: jobDescription || null,
            analysis: {
              cv_highlighting: parsedOutput.cv_highlighting,
              jd_highlighting: parsedOutput.jd_highlighting,
              match_score: parsedOutput.match_score
            }
          };
        } else {
          // Direct response format - validate it has required structure
          if (!responseData.analysis || 
              !responseData.analysis.cv_highlighting || 
              !responseData.analysis.jd_highlighting || 
              !responseData.analysis.match_score) {
            throw new Error('Invalid N8N response format: Missing required analysis structure');
          }
          processedData = responseData;
        }
        
        console.log('Final processed data structure:', processedData);
        
        if (!processedData || !processedData.analysis) {
          throw new Error('No valid analysis data received from N8N webhook');
        }
        
        // Final validation - ensure we have actual analysis results, not mock data
        const { cv_highlighting, jd_highlighting, match_score } = processedData.analysis;
        if (!cv_highlighting.length && !jd_highlighting.length && (!match_score.score && match_score.score !== 0)) {
          throw new Error('N8N webhook returned empty analysis results. Please check the workflow is properly configured and processing the data.');
        }
        
      } catch (parseError) {
        console.error('Error parsing N8N response:', parseError);
        console.error('Raw response data:', analysisData);
        throw new Error(`Failed to parse analysis response: ${parseError.message}`);
      }
      
      setProgress(100);
      setStatus('complete');
      onAnalysisComplete(processedData);

    } catch (err) {
      console.error('🔥 Analysis failed with error:', {
        message: err.message,
        stack: err.stack,
        apiUrl: useProxy 
          ? `http://localhost:3002/api/n8n/analyze-complete`
          : env.VITE_N8N_COMPLETE_ANALYSIS_URL || 'https://n8n.lakestrom.com/webhook/get_cvjd',
        useProxy: useProxy,
        environment: isProd ? 'production' : 'development',
        origin: window.location.origin,
        N8N_URL: env.VITE_N8N_COMPLETE_ANALYSIS_URL,
        PROXY_URL: env.VITE_PROXY_SERVER_URL,
        USE_PROXY_IN_PROD: env.VITE_USE_PROXY_IN_PROD,
        timestamp: new Date().toISOString()
      });
      console.error('Full error object:', err);
      
      // Enhanced error categorization
      let errorMessage = err.message;
      let errorType = 'GENERAL_ERROR';
      
      if (err.message.includes('CORS error')) {
        errorType = 'CORS_ERROR';
        console.error('🚫 CORS ERROR DETECTED - The webhook is blocking cross-origin requests');
      } else if (err.message.includes('N8N_WEBHOOK_NOT_ACTIVE') || err.message.includes('webhook') && err.message.includes('not registered')) {
        errorType = 'WEBHOOK_NOT_ACTIVE';
        console.error('⚠️ WEBHOOK NOT ACTIVE - The N8N workflow needs to be activated');
      } else if (err.message.includes('N8N_ERROR')) {
        errorType = 'N8N_SERVICE_ERROR';
        console.error('❌ N8N SERVICE ERROR - The webhook responded with an error');
      } else if (err.message.includes('Invalid N8N response') || err.message.includes('Missing required analysis')) {
        errorType = 'INVALID_RESPONSE';
        console.error('⚠️ INVALID RESPONSE - The webhook returned unexpected data format');
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorType = 'NETWORK_ERROR';
        errorMessage = `Network error: Unable to connect to ${useProxy ? 'proxy server' : 'N8N webhook'}. Please check your internet connection and try again.`;
        console.error('🌐 NETWORK ERROR - Unable to reach the server');
      }
      
      setError({ message: errorMessage, type: errorType });
      setStatus('error');
      setProgress(0);
    }
  };

  const performAnalysisThreeCalls = async () => {
    // Alternative: Keep the three separate calls approach
    setStatus('analyzing');
    setError(null);
    setProgress(0);

    try {
      // Step 1: Parse CV and JD in parallel
      setStatus('parsing-cv');
      setProgress(20);
      
      const [cvResult, jdResult] = await Promise.all([
        fetch('http://localhost:3002/api/n8n/cv-parser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, publicUrl: cvUrl })
        }),
        fetch('http://localhost:3002/api/n8n/jd-parser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, jobDescription })
        })
      ]);

      setProgress(60);

      if (!cvResult.ok || !jdResult.ok) {
        throw new Error('Failed to parse CV or JD');
      }

      const cvData = await cvResult.json();
      const jdData = await jdResult.json();

      // Step 2: Perform gap analysis
      setStatus('analyzing');
      setProgress(80);

      const analysisResponse = await fetch('http://localhost:3002/api/n8n/gap-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId,
          cvData: cvData.cvData,
          jdData: jdData.jdData
        })
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze gaps');
      }

      const analysisData = await analysisResponse.json();
      setProgress(100);
      setStatus('complete');
      onAnalysisComplete(analysisData);

    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'parsing-cv': return 'Parsing CV and Job Description...';
      case 'analyzing': return 'Analyzing gaps and matches...';
      case 'complete': return 'Analysis complete!';
      case 'error': {
        if (error?.type === 'WEBHOOK_NOT_ACTIVE') {
          return 'N8N Workflow Not Active: Please activate your analysis workflow in N8N and try again.';
        } else if (error?.type === 'N8N_SERVICE_ERROR') {
          return `N8N Service Error: ${error.message.replace('N8N_ERROR: ', '')}`;
        } else if (error?.type === 'CORS_ERROR') {
          return 'CORS Error: Cross-origin request blocked. See details below for solutions.';
        } else if (error?.type === 'INVALID_RESPONSE') {
          return 'Invalid Response: N8N webhook did not return expected analysis data.';
        } else if (error?.type === 'NETWORK_ERROR') {
          return 'Network Error: Unable to connect to analysis service.';
        }
        return `Error: ${error?.message || error}`;
      }
      default: return 'Ready to analyze';
    }
  };

  const getStatusColor = () => {
    if (status === 'error') return '#ff6b6b';
    if (status === 'complete') return '#00ff00';
    if (status === 'analyzing' || status === 'parsing-cv') return '#ffeb3b';
    return '#00ff00';
  };

  return (
    <div style={styles.container}>
      <button
        onClick={performAnalysis}
        disabled={!canAnalyze}
        style={{
          ...styles.button,
          opacity: canAnalyze ? 1 : 0.5,
          cursor: canAnalyze ? 'pointer' : 'not-allowed'
        }}
      >
        {status === 'analyzing' || status === 'parsing-cv' ? 'ANALYZING...' : 'ANALYSE'}
      </button>

      {status !== 'idle' && (
        <div style={styles.statusContainer}>
          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressFill,
              width: `${progress}%`
            }} />
          </div>
          <p style={{ ...styles.status, color: getStatusColor() }}>
            {getStatusMessage()}
          </p>
        </div>
      )}

      {status === 'error' && (
        <div style={styles.errorContainer}>
          {error?.type === 'WEBHOOK_NOT_ACTIVE' && (
            <div style={styles.webhookErrorInfo}>
              <p style={styles.errorTitle}>Workflow Not Active</p>
              <p style={styles.errorDescription}>
                The N8N analysis workflow needs to be activated before you can run analysis.
              </p>
              <p style={styles.errorInstructions}>To fix this:</p>
              <ol style={styles.errorSteps}>
                <li>Open your N8N workflow editor</li>
                <li>Find the "get_cvjd" workflow</li>
                <li>Click the "Execute Workflow" button to activate it</li>
                <li>Return here and retry the analysis</li>
              </ol>
            </div>
          )}
          
          {error?.type === 'CORS_ERROR' && (
            <div style={styles.corsErrorInfo}>
              <p style={styles.errorTitle}>CORS (Cross-Origin) Error</p>
              <p style={styles.errorDescription}>
                {error.message}
              </p>
              <p style={styles.errorInstructions}>Possible solutions:</p>
              <ol style={styles.errorSteps}>
                <li>If you have a proxy server, set VITE_USE_PROXY_IN_PROD=true in your environment variables</li>
                <li>Configure CORS headers on your N8N webhook to allow requests from {window.location.origin}</li>
                <li>Use a different hosting platform that supports CORS proxying</li>
              </ol>
            </div>
          )}
          
          {(error?.type === 'INVALID_RESPONSE' || error?.type === 'N8N_SERVICE_ERROR') && (
            <div style={styles.serviceErrorInfo}>
              <p style={styles.errorTitle}>
                {error.type === 'INVALID_RESPONSE' ? 'Invalid Response' : 'Service Error'}
              </p>
              <p style={styles.errorDescription}>{error.message}</p>
              <p style={styles.errorInstructions}>This suggests:</p>
              <ul style={styles.errorSteps}>
                <li>The N8N webhook may not be configured correctly</li>
                <li>The workflow might be returning unexpected data format</li>
                <li>Check N8N logs for detailed error information</li>
              </ul>
            </div>
          )}
          
          <button onClick={performAnalysis} style={styles.retryButton}>
            Retry Analysis
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#0a0a0a',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    textAlign: 'center',
    fontFamily: '"JetBrains Mono", monospace'
  },
  button: {
    padding: '15px 50px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#00ff00',
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    fontFamily: 'inherit',
    letterSpacing: '2px',
    transition: 'all 0.3s'
  },
  statusContainer: {
    marginTop: '20px'
  },
  progressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: '#1a1a1a',
    borderRadius: '2px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff00',
    transition: 'width 0.3s ease'
  },
  status: {
    fontSize: '14px',
    margin: '10px 0'
  },
  retryButton: {
    marginTop: '10px',
    padding: '8px 20px',
    backgroundColor: 'transparent',
    color: '#00ff00',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  errorContainer: {
    marginTop: '15px',
    textAlign: 'left'
  },
  webhookErrorInfo: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #ff6b6b',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '15px',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  corsErrorInfo: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #ffa500',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '15px',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  serviceErrorInfo: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #ff69b4',
    borderRadius: '4px',
    padding: '15px',
    marginBottom: '15px',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  errorTitle: {
    color: '#ff6b6b',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    fontSize: '16px'
  },
  errorDescription: {
    color: '#ffffff',
    margin: '0 0 10px 0'
  },
  errorInstructions: {
    color: '#ffa500',
    margin: '10px 0 5px 0',
    fontWeight: 'bold'
  },
  errorSteps: {
    color: '#ffffff',
    margin: '5px 0 0 20px',
    paddingLeft: '0'
  }
};

export default AnalysisControl;