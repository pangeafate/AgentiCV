import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { uploadCV } from '../../../services/supabase/cv.service'

const CVUploader = ({ onStatusChange }) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFile, setUploadedFile] = useState(null)

  // File validation
  const validateFile = (file) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is 10MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Supported formats: PDF, DOC, DOCX`)
    }

    return true
  }

  // Handle file upload
  const handleUpload = async (file) => {
    try {
      setUploading(true)
      setUploadProgress(0)
      
      // Validate file
      validateFile(file)
      
      onStatusChange(`Validating file: ${file.name}`)
      onStatusChange(`File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 30
          return next > 90 ? 90 : next
        })
      }, 200)

      // Upload to Supabase
      const result = await uploadCV(file)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      setUploadedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.url,
        path: result.path
      })
      
      onStatusChange(`✓ Upload complete: ${file.name}`)
      onStatusChange(`File stored at: ${result.path}`)
      
      toast.success(`CV uploaded successfully: ${file.name}`)
      
    } catch (error) {
      console.error('Upload error:', error)
      onStatusChange(`✗ Upload failed: ${error.message}`)
      toast.error(`Upload failed: ${error.message}`)
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  // Dropzone configuration
  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach(error => {
          toast.error(`${file.name}: ${error.message}`)
        })
      })
      return
    }

    if (acceptedFiles.length > 0) {
      await handleUpload(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    multiple: false,
    disabled: uploading
  })

  return (
    <div style={{ width: '100%' }}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--terminal-green)' : 'var(--terminal-border)'}`,
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-2xl)',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: isDragActive ? 'rgba(0, 255, 0, 0.05)' : 'var(--terminal-bg-secondary)',
          transition: 'all 0.3s ease',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-md)'
        }}
      >
        <input {...getInputProps()} />
        
        {/* Upload Icon */}
        <div style={{
          fontSize: '3rem',
          color: isDragActive ? 'var(--terminal-green)' : 'var(--terminal-gray)'
        }}>
          📄
        </div>
        
        {/* Upload Text */}
        <div>
          {uploading ? (
            <div>
              <p style={{ color: 'var(--terminal-amber)', marginBottom: 'var(--spacing-sm)' }}>
                Uploading CV...
              </p>
              <div style={{
                width: '300px',
                height: '6px',
                backgroundColor: 'var(--terminal-bg)',
                borderRadius: '3px',
                overflow: 'hidden',
                margin: '0 auto'
              }}>
                <div style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  backgroundColor: 'var(--terminal-green)',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ 
                color: 'var(--terminal-green)', 
                fontSize: '0.875rem', 
                marginTop: 'var(--spacing-sm)' 
              }}>
                {uploadProgress.toFixed(0)}%
              </p>
            </div>
          ) : isDragActive ? (
            <p style={{ color: 'var(--terminal-green)' }}>
              Drop your CV here...
            </p>
          ) : (
            <div>
              <p style={{ color: 'var(--terminal-green)', marginBottom: 'var(--spacing-xs)' }}>
                Drag & drop your CV here, or click to browse
              </p>
              <p style={{ color: 'var(--terminal-gray)', fontSize: '0.875rem' }}>
                Supported formats: PDF, DOC, DOCX (max 10MB)
              </p>
            </div>
          )}
        </div>
        
        {/* Browse Button */}
        {!uploading && !isDragActive && (
          <button 
            className="btn btn-secondary"
            style={{ marginTop: 'var(--spacing-md)' }}
          >
            Browse Files
          </button>
        )}
      </div>

      {/* Uploaded File Info */}
      {uploadedFile && (
        <div style={{
          marginTop: 'var(--spacing-lg)',
          padding: 'var(--spacing-lg)',
          backgroundColor: 'var(--terminal-bg-secondary)',
          border: '1px solid var(--terminal-green)',
          borderRadius: 'var(--radius-md)'
        }}>
          <h3 style={{
            color: 'var(--terminal-green)',
            marginBottom: 'var(--spacing-md)',
            fontSize: '1rem'
          }}>
            ✓ Uploaded Successfully
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'auto 1fr', 
            gap: 'var(--spacing-sm) var(--spacing-md)',
            fontSize: '0.875rem'
          }}>
            <span style={{ color: 'var(--terminal-amber)' }}>File:</span>
            <span style={{ color: 'var(--terminal-white)' }}>{uploadedFile.name}</span>
            
            <span style={{ color: 'var(--terminal-amber)' }}>Size:</span>
            <span style={{ color: 'var(--terminal-white)' }}>
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
            
            <span style={{ color: 'var(--terminal-amber)' }}>Type:</span>
            <span style={{ color: 'var(--terminal-white)' }}>{uploadedFile.type}</span>
            
            <span style={{ color: 'var(--terminal-amber)' }}>Path:</span>
            <span style={{ 
              color: 'var(--terminal-blue)', 
              wordBreak: 'break-all',
              fontFamily: 'var(--font-mono)'
            }}>
              {uploadedFile.path}
            </span>
          </div>
          
          <div style={{ 
            marginTop: 'var(--spacing-lg)', 
            display: 'flex', 
            gap: 'var(--spacing-md)' 
          }}>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setUploadedFile(null)
                setUploadProgress(0)
                onStatusChange('Ready for new upload')
              }}
            >
              Upload Another
            </button>
            
            {uploadedFile.url && (
              <a 
                href={uploadedFile.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                View File
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CVUploader