import React, { useRef, useEffect, useMemo } from 'react';
import HighlightedContent from '../HighlightedContent';

const GapAnalysisResults = ({ 
  cvData, 
  jdData, 
  cvHighlighting = [], 
  jdHighlighting = [],
  matchScores = {}
}) => {
  // Memoize props validation to prevent infinite re-renders
  const validationResult = useMemo(() => {
    // Check if this looks like an error response from N8N
    const isErrorResponse = matchScores && (
      matchScores.code === 404 || 
      matchScores.code === 500 ||
      (typeof matchScores.message === 'string' && matchScores.message.includes('webhook'))
    );
    
    // Check if we have any valid analysis data
    const hasValidData = (
      (cvHighlighting && cvHighlighting.length > 0) ||
      (jdHighlighting && jdHighlighting.length > 0) ||
      (matchScores && typeof matchScores.overall_score === 'number')
    );
    
    return {
      isErrorResponse,
      hasValidData,
      shouldRender: !isErrorResponse && hasValidData
    };
  }, [cvHighlighting, jdHighlighting, matchScores]);
  
  // Only log once when validation result changes
  useEffect(() => {
    console.log('GapAnalysisResults validation:', {
      cvData: cvData ? 'present' : 'missing',
      jdData: jdData ? 'present' : 'missing',
      cvHighlighting: cvHighlighting?.length || 0,
      jdHighlighting: jdHighlighting?.length || 0,
      matchScores,
      validationResult
    });
  }, [validationResult.shouldRender]);
  const cvPanelRef = useRef(null);
  const jdPanelRef = useRef(null);

  // Synchronized scrolling
  useEffect(() => {
    const handleCVScroll = () => {
      if (jdPanelRef.current && cvPanelRef.current) {
        jdPanelRef.current.scrollTop = cvPanelRef.current.scrollTop;
      }
    };

    const handleJDScroll = () => {
      if (cvPanelRef.current && jdPanelRef.current) {
        cvPanelRef.current.scrollTop = jdPanelRef.current.scrollTop;
      }
    };

    const cvPanel = cvPanelRef.current;
    const jdPanel = jdPanelRef.current;

    if (cvPanel) cvPanel.addEventListener('scroll', handleCVScroll);
    if (jdPanel) jdPanel.addEventListener('scroll', handleJDScroll);

    return () => {
      if (cvPanel) cvPanel.removeEventListener('scroll', handleCVScroll);
      if (jdPanel) jdPanel.removeEventListener('scroll', handleJDScroll);
    };
  }, []);

  // Handle error responses from N8N
  if (validationResult.isErrorResponse) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.status, color: '#ff6b6b' }}>
          <h3 style={styles.errorTitle}>Analysis Error</h3>
          <p>Received an error response from the N8N service.</p>
          {matchScores.message && (
            <p style={styles.errorDetails}>Error: {matchScores.message}</p>
          )}
          <p style={styles.errorInstructions}>
            Please check that your N8N workflow is active and try running the analysis again.
          </p>
        </div>
      </div>
    );
  }
  
  // Show message if no valid analysis data is available
  if (!validationResult.hasValidData) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.status, color: '#ffa500' }}>
          <h3 style={styles.warningTitle}>No Analysis Data</h3>
          <p>No valid analysis data was received. This could mean:</p>
          <ul style={styles.warningList}>
            <li>The N8N workflow returned an empty response</li>
            <li>The analysis processing failed</li>
            <li>The response format is unexpected</li>
          </ul>
          <p style={styles.errorInstructions}>
            Please try running the analysis again or check your N8N workflow configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.legend}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#00ff00' }}></span>
          Match
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#ffa500' }}></span>
          Partial
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#ff6b6b' }}></span>
          Gap
        </span>
      </div>

      <div style={styles.panels}>
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>CV Analysis</h3>
          <div ref={cvPanelRef} style={styles.content}>
            <HighlightedContent
              data={cvData}
              highlights={cvHighlighting}
              type="cv"
            />
          </div>
        </div>

        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Job Description Analysis</h3>
          <div ref={jdPanelRef} style={styles.content}>
            <HighlightedContent
              data={jdData}
              highlights={jdHighlighting}
              type="jd"
            />
          </div>
        </div>
      </div>

      {matchScores.overall_score !== undefined && (
        <div style={styles.scores}>
          <h3 style={styles.scoresTitle}>Match Analysis</h3>
          <div style={styles.scoreGrid}>
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>Overall Match:</span>
              <span style={styles.scoreValue}>{matchScores.overall_score}%</span>
            </div>
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>Skills:</span>
              <span style={styles.scoreValue}>{matchScores.skills_score}%</span>
            </div>
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>Experience:</span>
              <span style={styles.scoreValue}>{matchScores.experience_score}%</span>
            </div>
            <div style={styles.scoreItem}>
              <span style={styles.scoreLabel}>Education:</span>
              <span style={styles.scoreValue}>{matchScores.education_score}%</span>
            </div>
          </div>

          {matchScores.recommendations && (
            <div style={styles.recommendations}>
              <h4 style={styles.recTitle}>Recommendations:</h4>
              <ul style={styles.recList}>
                {matchScores.recommendations.map((rec, idx) => (
                  <li key={idx} style={styles.recItem}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
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
    fontFamily: '"JetBrains Mono", monospace'
  },
  legend: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    justifyContent: 'center'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#00ff00',
    fontSize: '14px'
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%'
  },
  panels: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  panel: {
    border: '1px solid #00ff00',
    borderRadius: '4px',
    backgroundColor: '#1a1a1a'
  },
  panelTitle: {
    margin: 0,
    padding: '10px 15px',
    backgroundColor: '#0a0a0a',
    color: '#00ff00',
    borderBottom: '1px solid #00ff00'
  },
  content: {
    padding: '15px',
    maxHeight: '500px',
    overflowY: 'auto',
    color: '#00ff00'
  },
  scores: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#1a1a1a',
    borderRadius: '4px'
  },
  scoresTitle: {
    color: '#00ff00',
    marginBottom: '15px'
  },
  scoreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px'
  },
  scoreItem: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  scoreLabel: {
    color: '#00ff00',
    fontSize: '14px'
  },
  scoreValue: {
    color: '#00ff00',
    fontWeight: 'bold'
  },
  recommendations: {
    marginTop: '20px'
  },
  recTitle: {
    color: '#00ff00',
    marginBottom: '10px'
  },
  recList: {
    marginLeft: '20px'
  },
  recItem: {
    color: '#00ff00',
    marginBottom: '5px'
  },
  status: {
    fontSize: '14px',
    margin: '10px 0',
    textAlign: 'center'
  },
  errorTitle: {
    color: '#ff6b6b',
    margin: '0 0 15px 0',
    fontSize: '18px'
  },
  warningTitle: {
    color: '#ffa500',
    margin: '0 0 15px 0',
    fontSize: '18px'
  },
  errorDetails: {
    color: '#ff6b6b',
    fontSize: '13px',
    backgroundColor: '#1a1a1a',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ff6b6b',
    margin: '10px 0'
  },
  errorInstructions: {
    color: '#ffffff',
    fontSize: '14px',
    fontStyle: 'italic',
    marginTop: '15px'
  },
  warningList: {
    color: '#ffffff',
    textAlign: 'left',
    marginLeft: '20px',
    fontSize: '14px'
  }
};

export default GapAnalysisResults;