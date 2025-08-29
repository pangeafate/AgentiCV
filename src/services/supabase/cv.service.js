import { supabase, CV_BUCKET_NAME, UPLOAD_CONFIG } from './config.js';

export class CVService {
  /**
   * Upload CV file to Supabase Storage
   * @param {File} file - The CV file to upload
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  static async uploadCV(file) {
    try {
      // Validate file
      if (!this.validateFile(file)) {
        return {
          success: false,
          error: 'Invalid file type or size. Please upload a PDF, DOC, or DOCX file under 10MB.'
        };
      }

      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(CV_BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(CV_BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        success: true,
        data: {
          id: fileName,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadPath: data.path,
          publicUrl: publicUrlData.publicUrl,
          uploadedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('CV upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`
      };
    }
  }

  /**
   * Delete CV file from storage
   * @param {string} fileName - The file name to delete
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deleteCV(fileName) {
    try {
      const { error } = await supabase.storage
        .from(CV_BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        return {
          success: false,
          error: `Delete failed: ${error.message}`
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Delete failed: ${error.message}`
      };
    }
  }

  /**
   * Validate uploaded file
   * @param {File} file - File to validate
   * @returns {boolean} - Whether file is valid
   */
  static validateFile(file) {
    // Check file size
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      return false;
    }

    // Check file type
    if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
      return false;
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!UPLOAD_CONFIG.allowedExtensions.includes(extension)) {
      return false;
    }

    return true;
  }

  /**
   * Get file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}