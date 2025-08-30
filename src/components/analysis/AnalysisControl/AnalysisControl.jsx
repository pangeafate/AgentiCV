import React, { useState } from 'react';

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
      // Use proxy in development, direct webhook in production
      const apiUrl = import.meta.env.VITE_USE_PROXY === 'false' 
        ? import.meta.env.VITE_N8N_COMPLETE_ANALYSIS_URL
        : 'http://localhost:3002/api/n8n/analyze-complete';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          cvUrl,           // URL to the CV file
          jobDescription   // JD text
        })
      });

      setProgress(80);

      if (!response.ok) {
        throw new Error('Failed to analyze CV and JD');
      }

      const analysisData = await response.json();
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
          processedData = {
            cvData: cvUrl ? 'CV content processed' : null, // Placeholder - ideally should come from response
            jdData: jobDescription || null,
            analysis: {
              cv_highlighting: parsedOutput.cv_highlighting || [],
              jd_highlighting: parsedOutput.jd_highlighting || [],
              match_score: parsedOutput.match_score || {}
            }
          };
        } else {
          // Fallback for direct response format
          processedData = responseData;
        }
        
        console.log('Final processed data structure:', processedData);
        
        if (!processedData) {
          throw new Error('Unable to parse response data');
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
      console.error('Analysis failed:', err);
      setError(err.message);
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
        if (error && error.includes('N8N_WEBHOOK_NOT_ACTIVE')) {
          return 'N8N Workflow Not Active: Please activate your analysis workflow in N8N and try again.';
        } else if (error && error.includes('N8N_ERROR')) {
          return `N8N Service Error: ${error.replace('N8N_ERROR: ', '')}`;
        }
        return `Error: ${error}`;
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
          {error && error.includes('N8N_WEBHOOK_NOT_ACTIVE') && (
            <div style={styles.webhookErrorInfo}>
              <p style={styles.errorTitle}>Workflow Not Active</p>
              <p style={styles.errorDescription}>
                The N8N analysis workflow needs to be activated before you can run analysis.
              </p>
              <p style={styles.errorInstructions}>
                To fix this:
              </p>
              <ol style={styles.errorSteps}>
                <li>Open your N8N workflow editor</li>
                <li>Find the "get_cvjd" workflow</li>
                <li>Click the "Execute Workflow" button to activate it</li>
                <li>Return here and retry the analysis</li>
              </ol>
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