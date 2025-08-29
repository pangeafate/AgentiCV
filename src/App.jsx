import React, { useState, useEffect } from 'react'
import CVUploader from './components/cv/CVUploader/CVUploader'

function App() {
  const [currentTime, setCurrentTime] = useState('')
  const [terminalLines, setTerminalLines] = useState([])

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
            gridTemplateColumns: '1fr',
            gap: 'var(--spacing-xl)',
          }}>
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
              
              <CVUploader onStatusChange={addTerminalLine} />
            </section>

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