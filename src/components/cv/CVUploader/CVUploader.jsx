import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { CVService } from '../../../services/supabase/cv.service.js';

const CVUploader = ({ onUploadSuccess, onUploadError }) => {
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadedFile, setUploadedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');

  const handleUpload = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    try {
      setUploadStatus('uploading');
      setCurrentTask('Validating file...');
      setProgress(25);

      // Simulate progress for better UX
      setTimeout(() => {
        setCurrentTask('Uploading to secure storage...');
        setProgress(50);
      }, 500);

      const result = await CVService.uploadCV(file);

      if (result.success) {
        setProgress(100);
        setCurrentTask('Upload complete!');
        setUploadedFile({
          ...result.data,
          originalFile: file
        });
        setUploadStatus('success');
        
        toast.success(`CV uploaded successfully: ${file.name}`);
        
        // Call success callback if provided
        if (onUploadSuccess) {
          onUploadSuccess(result.data);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setCurrentTask('Upload failed');
      
      toast.error(error.message || 'Failed to upload CV');
      
      // Call error callback if provided
      if (onUploadError) {
        onUploadError(error);
      }
    } finally {
      setTimeout(() => {
        setProgress(0);
        setCurrentTask('');
      }, 2000);
    }
  }, [onUploadSuccess, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleUpload,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: uploadStatus === 'uploading'
  });

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadedFile(null);
    setProgress(0);
    setCurrentTask('');
  };

  const handleDelete = async () => {
    if (!uploadedFile?.id) return;
    
    try {
      const result = await CVService.deleteCV(uploadedFile.id);
      if (result.success) {
        toast.success('CV deleted successfully');
        resetUpload();
      } else {
        toast.error(result.error || 'Failed to delete CV');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete CV');
    }
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-title">CV_UPLOAD.INTERFACE</div>
        <div className="terminal-controls">
          <div className="terminal-dot red"></div>
          <div className="terminal-dot yellow"></div>
          <div className="terminal-dot green"></div>
        </div>
      </div>
      
      <div className="terminal-content">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''} ${uploadStatus === 'uploading' ? 'disabled' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div>
            {uploadStatus === 'success' && uploadedFile ? (
              // Success State
              <div className="text-center">
                <div className="text-success mb-3" style={{ fontSize: '16px' }}>
                  ✓ [CV_UPLOADED] {uploadedFile.fileName}
                </div>
                
                <div className="file-info file-info-success mb-3">
                  <div>File Size: {CVService.formatFileSize(uploadedFile.fileSize)}</div>
                  <div>Type: {uploadedFile.fileType}</div>
                  <div>Uploaded: {new Date(uploadedFile.uploadedAt).toLocaleString()}</div>
                </div>
                
                <div className="mb-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUpload();
                    }}
                    className="btn btn-secondary"
                    style={{ marginRight: '8px' }}
                  >
                    [UPLOAD_NEW]
                  </button>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="btn btn-danger"
                  >
                    [DELETE]
                  </button>
                </div>
                
                <div style={{ fontSize: '11px', color: '#666666' }}>
                  CV ready for AI analysis processing
                </div>
              </div>
            ) : uploadStatus === 'uploading' ? (
              // Uploading State
              <div className="text-center">
                <div className="loading mb-3">
                  <span className="loading-spinner"></span>
                  {currentTask || 'PROCESSING CV...'}
                </div>
                
                <div className="progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <div style={{ fontSize: '12px', color: '#666666', marginTop: '8px' }}>
                  PROGRESS: {progress}%
                </div>
                
                <div style={{ fontSize: '11px', color: '#666666', marginTop: '12px' }}>
                  • Validating document format and content
                  <br />
                  • Uploading to secure cloud storage
                  <br />
                  • Preparing for AI analysis pipeline
                </div>
              </div>
            ) : isDragActive ? (
              // Drag Active State
              <div className="text-center">
                <div style={{ color: '#ffffff', fontWeight: '600', marginBottom: '8px', fontSize: '16px' }}>
                  [DROP_FILE] Release to upload CV
                </div>
                <div style={{ fontSize: '11px', color: '#666666' }}>
                  Processing will begin immediately after drop
                </div>
              </div>
            ) : (
              // Default State
              <div className="text-center">
                <div style={{ marginBottom: '12px', fontSize: '18px' }}>
                  [CV_UPLOAD] Drop your resume here
                </div>
                
                <div style={{ fontSize: '12px', color: '#666666', marginBottom: '16px' }}>
                  SUPPORTED FORMATS: PDF, DOC, DOCX
                  <br />
                  MAX SIZE: 10MB
                </div>
                
                <button className="btn btn-primary">
                  [SELECT_FILE] Browse Computer
                </button>
                
                <div style={{ fontSize: '10px', color: '#888888', marginTop: '12px' }}>
                  Drag and drop your CV file or click to select from your device
                  <br />
                  Files are securely stored and processed using AI technology
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Upload Status Messages */}
        {uploadStatus === 'error' && (
          <div className="file-info file-info-error mt-3">
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
              ✗ [UPLOAD_FAILED] File processing error
            </div>
            <div style={{ fontSize: '10px' }}>
              Please check file format and size requirements, then try again
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVUploader;