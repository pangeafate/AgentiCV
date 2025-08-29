import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import CVUploader from './components/cv/CVUploader';

function App() {
  const [uploadedCVs, setUploadedCVs] = useState([]);
  const [systemStatus, setSystemStatus] = useState('online');

  const handleUploadSuccess = (cvData) => {
    console.log('CV Upload Success:', cvData);
    setUploadedCVs(prev => [...prev, cvData]);
  };

  const handleUploadError = (error) => {
    console.error('CV Upload Error:', error);
  };

  return (
    <div className="container" style={{ padding: '20px', minHeight: '100vh' }}>
      {/* System Header */}
      <div className="terminal-window" style={{ marginBottom: '20px' }}>
        <div className="terminal-header">
          <div className="terminal-title">AGENTI_CV.SYSTEM_V1.0</div>
          <div className="terminal-controls">
            <div className="terminal-dot red"></div>
            <div className="terminal-dot yellow"></div>
            <div className="terminal-dot green"></div>
          </div>
        </div>
        <div className="terminal-content">
          <h1 style={{ marginBottom: '8px' }}>
            AI-POWERED CV ANALYSIS PLATFORM
          </h1>
          <p style={{ color: '#666666', margin: '0', fontSize: '13px' }}>
            Upload your CV for intelligent analysis and optimization recommendations
          </p>
          
          {/* System Status */}
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            marginTop: '16px', 
            fontSize: '11px' 
          }}>
            <span className="status status-success">
              <span className="status-dot"></span>
              SYSTEM_{systemStatus.toUpperCase()}
            </span>
            <span className="status status-info">
              <span className="status-dot"></span>
              STORAGE_READY
            </span>
            <span className="status status-info">
              <span className="status-dot"></span>
              AI_ENGINE_STANDBY
            </span>
          </div>
        </div>
      </div>

      {/* Main Upload Interface */}
      <div style={{ marginBottom: '20px' }}>
        <CVUploader 
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </div>

      {/* Upload History */}
      {uploadedCVs.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <span className="status status-success">
                <span className="status-dot"></span>
                UPLOAD_HISTORY
              </span>
            </div>
          </div>
          <div className="panel-content">
            <div style={{ fontSize: '12px', marginBottom: '12px', color: '#666666' }}>
              {uploadedCVs.length} file(s) successfully uploaded
            </div>
            
            {uploadedCVs.map((cv, index) => (
              <div 
                key={cv.id || index} 
                className="file-info file-info-success" 
                style={{ marginBottom: '8px' }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontWeight: '600' }}>
                    {cv.fileName}
                  </span>
                  <span className="text-success">
                    ✓ READY
                  </span>
                </div>
                
                <div style={{ fontSize: '10px', color: '#888888' }}>
                  Size: {cv.fileSize ? (cv.fileSize / 1024 / 1024).toFixed(2) : 'Unknown'} MB | 
                  Uploaded: {cv.uploadedAt ? new Date(cv.uploadedAt).toLocaleTimeString() : 'Unknown'} |
                  ID: {cv.id?.substring(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions Panel */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <span className="status status-info">
              <span className="status-dot"></span>
              SYSTEM_INSTRUCTIONS
            </span>
          </div>
        </div>
        <div className="panel-content">
          <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#ffffff', fontWeight: '600', marginBottom: '4px' }}>
                [STEP_1] UPLOAD_CV
              </div>
              <div style={{ color: '#666666', fontSize: '11px' }}>
                Drag and drop your CV file (PDF, DOC, DOCX) or click to browse
              </div>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#ffffff', fontWeight: '600', marginBottom: '4px' }}>
                [STEP_2] AI_ANALYSIS
              </div>
              <div style={{ color: '#666666', fontSize: '11px' }}>
                Our AI engine will analyze your CV structure, content, and keywords
              </div>
            </div>
            
            <div>
              <div style={{ color: '#ffffff', fontWeight: '600', marginBottom: '4px' }}>
                [STEP_3] OPTIMIZATION
              </div>
              <div style={{ color: '#666666', fontSize: '11px' }}>
                Receive personalized recommendations to improve your CV effectiveness
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '40px', 
        padding: '20px 0',
        borderTop: '1px solid #333333',
        fontSize: '10px',
        color: '#666666'
      }}>
        <div>
          AGENTI_CV © 2024 | AI-Powered Career Enhancement Platform
        </div>
        <div style={{ marginTop: '4px' }}>
          Powered by Supabase Storage & Advanced ML Algorithms
        </div>
      </div>

      {/* Toast Container */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a1a',
            color: '#ffffff',
            border: '1px solid #333333',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
          },
          success: {
            iconTheme: {
              primary: '#27ca3f',
              secondary: '#000000',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff5f56',
              secondary: '#000000',
            },
          },
        }}
      />
    </div>
  );
}

export default App;