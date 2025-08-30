import React, { useState, useEffect } from 'react'
import CVUploader from './components/cv/CVUploader/CVUploader'
import JDInput from './components/jd/JDInput/JDInput'
import AnalysisControl from './components/analysis/AnalysisControl/AnalysisControl'
import GapAnalysisResults from './components/analysis/GapAnalysisResults/GapAnalysisResults'

function App() {
  const [currentTime, setCurrentTime] = useState('')
  const [terminalLines, setTerminalLines] = useState([])
  const [sessionId] = useState(() => crypto.randomUUID())
  const [cvReady, setCvReady] = useState(false)
  const [cvUrl, setCvUrl] = useState('')
  const [jdReady, setJdReady] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [analysisResults, setAnalysisResults] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)

    // Initialize terminal with welcome messages
    const initMessages = [
      'Welcome to AgenticV Terminal v1.0.0',
      'Initializing CV processing system...',
      'System ready. Upload your CV to begin analysis.',
      ''
    ]
    
    // Add messages with typing effect
    initMessages.forEach((message, index) => {
      setTimeout(() => {
        setTerminalLines(prev => [...prev, message])
      }, index * 800)
    })

    return () => clearInterval(timer)
  }, [])

  const addTerminalLine = (line) => {
    setTerminalLines(prev => [...prev, line])
  }

  const handleCVUpload = (url) => {
    setCvUrl(url)
    setCvReady(true)
    addTerminalLine('CV uploaded successfully')
  }

  const handleJDReady = (text, isValid) => {
    setJobDescription(text)
    setJdReady(isValid)
    if (isValid) {
      addTerminalLine('Job description ready for analysis')
    }
  }

  const handleAnalysisComplete = (results) => {
    // Check if the results contain error information
    if (results && (results.code === 404 || results.code === 500)) {
      setAnalysisError(results)
      setAnalysisResults(null)
      addTerminalLine(`Analysis failed: ${results.message || 'Unknown error'}`)
      return
    }
    
    // Clear any previous errors and set valid results
    setAnalysisError(null)
    setAnalysisResults(results)
    addTerminalLine('Analysis complete!')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--terminal-bg)',
      padding: 'var(--spacing-lg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Main Terminal Window */}
      <div className="terminal-window" style={{
        width: '100%',
        maxWidth: '1200px',
        minHeight: '700px'
      }}>
        {/* Terminal Header */}
        <div className="terminal-header">
          <div className="terminal-controls">
            <button className="terminal-control close" aria-label="Close"></button>
            <button className="terminal-control minimize" aria-label="Minimize"></button>
            <button className="terminal-control maximize" aria-label="Maximize"></button>
          </div>
          <div className="terminal-title">
            AgenticV Terminal - CV Upload System
          </div>
          <div style={{ 
            marginLeft: 'auto', 
            color: 'var(--terminal-green)', 
            fontSize: '0.75rem' 
          }}>
            {currentTime}
          </div>
        </div>

        {/* Terminal Content */}
        <div className="terminal-content">
          {/* Terminal Output */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            {terminalLines.map((line, index) => (
              <div key={index} className="terminal-text" style={{
                marginBottom: 'var(--spacing-xs)',
                opacity: line === '' ? 0.5 : 1
              }}>
                {line}
              </div>
            ))}
            <div className="terminal-prompt terminal-text" style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              marginTop: 'var(--spacing-md)'
            }}>
              Ready for CV upload
              <span className="terminal-cursor"></span>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: (analysisResults || analysisError) ? '1fr' : '1fr 1fr',
            gap: 'var(--spacing-xl)',
          }}>
            {!analysisResults && !analysisError ? (
              <>
                {/* Upload Section */}
                <section>
                  <h2 style={{
                    color: 'var(--terminal-amber)',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    marginBottom: 'var(--spacing-lg)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {'>'} Upload CV Document
                  </h2>
                  
                  <CVUploader 
                    onStatusChange={addTerminalLine}
                    onUploadComplete={handleCVUpload}
                    sessionId={sessionId}
                  />
                </section>

                {/* JD Input Section */}
                <section>
                  <h2 style={{
                    color: 'var(--terminal-amber)',
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    marginBottom: 'var(--spacing-lg)',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {'>'} Job Description
                  </h2>
                  
                  <JDInput
                    onJDReady={handleJDReady}
                    sessionId={sessionId}
                  />
                </section>
              </>
            ) : (
              <section style={{ gridColumn: '1 / -1' }}>
                <button
                  onClick={() => {
                    setAnalysisResults(null)
                    setAnalysisError(null)
                    setCvReady(false)
                    setJdReady(false)
                    setCvUrl('')
                    setJobDescription('')
                    addTerminalLine('Starting new analysis...')
                  }}
                  style={{
                    marginBottom: '20px',
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#00ff00',
                    border: '1px solid #00ff00',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  New Analysis
                </button>
                
                {analysisError ? (
                  <div style={{
                    padding: '20px',
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #ff6b6b',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontFamily: '"JetBrains Mono", monospace'
                  }}>
                    <h3 style={{ color: '#ff6b6b', marginBottom: '15px' }}>Analysis Failed</h3>
                    <p style={{ color: '#ffffff', marginBottom: '15px' }}>
                      {analysisError.message || 'An error occurred during analysis'}
                    </p>
                    {analysisError.message && analysisError.message.includes('webhook') && (
                      <div style={{
                        backgroundColor: '#1a1a1a',
                        padding: '15px',
                        borderRadius: '4px',
                        textAlign: 'left',
                        fontSize: '14px'
                      }}>
                        <p style={{ color: '#ffa500', fontWeight: 'bold', marginBottom: '10px' }}>
                          Quick Fix:
                        </p>
                        <ol style={{ color: '#ffffff', marginLeft: '20px' }}>
                          <li>Open your N8N workflow editor</li>
                          <li>Find and activate the "get_cvjd" webhook</li>
                          <li>Return here and try the analysis again</li>
                        </ol>
                      </div>
                    )}
                  </div>
                ) : (
                  <GapAnalysisResults
                    cvData={analysisResults?.cvData}
                    jdData={analysisResults?.jdData}
                    cvHighlighting={analysisResults?.analysis?.cv_highlighting}
                    jdHighlighting={analysisResults?.analysis?.jd_highlighting}
                    matchScores={analysisResults?.analysis?.match_score}
                  />
                )}
              </section>
            )}

            {/* System Info */}
            <section style={{
              borderTop: '1px solid var(--terminal-border)',
              paddingTop: 'var(--spacing-lg)',
              marginTop: 'var(--spacing-lg)'
            }}>
              <h3 style={{
                color: 'var(--terminal-blue)',
                fontSize: '1rem',
                marginBottom: 'var(--spacing-md)',
                fontFamily: 'var(--font-mono)'
              }}>
                System Information
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                fontSize: '0.875rem',
                color: 'var(--terminal-gray)'
              }}>
                <div>
                  <span style={{ color: 'var(--terminal-green)' }}>Status:</span> Online
                </div>
                <div>
                  <span style={{ color: 'var(--terminal-green)' }}>Version:</span> 1.0.0
                </div>
                <div>
                  <span style={{ color: 'var(--terminal-green)' }}>Uptime:</span> {currentTime}
                </div>
                <div>
                  <span style={{ color: 'var(--terminal-green)' }}>Storage:</span> Supabase
                </div>
              </div>
            </section>

            {/* Analysis Control */}
            {!analysisResults && !analysisError && (
              <section style={{
                gridColumn: '1 / -1',
                marginTop: 'var(--spacing-lg)'
              }}>
                <AnalysisControl
                  cvReady={cvReady}
                  jdReady={jdReady}
                  sessionId={sessionId}
                  cvUrl={cvUrl}
                  jobDescription={jobDescription}
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </section>
            )}
          </div>

          {/* Footer */}
          <footer style={{
            marginTop: 'var(--spacing-2xl)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--terminal-border)',
            textAlign: 'center',
            color: 'var(--terminal-gray)',
            fontSize: '0.75rem'
          }}>
            <p>
              AgenticV Terminal | Powered by React + Vite | 
              <span style={{ color: 'var(--terminal-green)' }}> Ready for deployment</span>
            </p>
            <p style={{ marginTop: 'var(--spacing-xs)' }}>
              Upload supported formats: PDF, DOC, DOCX | Max size: 10MB
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default App