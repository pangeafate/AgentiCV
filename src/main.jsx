import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#1a1a1a',
          color: '#00ff00',
          border: '1px solid #00ff00',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '14px',
        },
        success: {
          iconTheme: {
            primary: '#00ff00',
            secondary: '#1a1a1a',
          },
        },
        error: {
          iconTheme: {
            primary: '#ff5555',
            secondary: '#1a1a1a',
          },
        },
      }}
    />
  </React.StrictMode>,
)