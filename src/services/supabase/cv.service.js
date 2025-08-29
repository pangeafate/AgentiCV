import { supabase, STORAGE_CONFIG, isSupabaseConfigured } from './config'

/**
 * Generate a unique file name with timestamp and random suffix
 * @param {string} originalName - Original file name
 * @returns {string} - Unique file name
 */
const generateUniqueFileName = (originalName) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'))
  
  return `${timestamp}_${baseName}_${randomSuffix}${extension}`
}

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @throws {Error} - Validation error
 */
const validateFile = (file) => {
  // Check file size
  if (file.size > STORAGE_CONFIG.maxFileSize) {
    throw new Error(
      `File size too large. Maximum allowed: ${(STORAGE_CONFIG.maxFileSize / 1024 / 1024).toFixed(1)}MB, ` +
      `got: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    )
  }

  // Check file type
  if (!STORAGE_CONFIG.allowedMimeTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Supported formats: PDF, DOC, DOCX`)
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
  if (!STORAGE_CONFIG.allowedExtensions.includes(extension)) {
    throw new Error(`Invalid file extension. Supported extensions: ${STORAGE_CONFIG.allowedExtensions.join(', ')}`)
  }

  return true
}

/**
 * Upload CV file to Supabase storage
 * @param {File} file - File to upload
 * @returns {Promise<Object>} - Upload result with URL and path
 */
export const uploadCV = async (file) => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      // Mock successful upload for development/demo
      console.warn('Supabase not configured, returning mock success response')
      
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate upload time
      
      return {
        success: true,
        path: `mock/cv-uploads/${generateUniqueFileName(file.name)}`,
        url: `https://mock-storage.supabase.co/storage/v1/object/public/cv-documents/${generateUniqueFileName(file.name)}`,
        message: 'File uploaded successfully (mock mode)',
        metadata: {
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }
      }
    }

    // Validate file
    validateFile(file)

    // Generate unique file name
    const fileName = generateUniqueFileName(file.name)
    const filePath = `cv-uploads/${fileName}`

    console.log(`Uploading file: ${file.name} -> ${filePath}`)

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_CONFIG.bucketName)
      .getPublicUrl(filePath)

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl,
      message: 'File uploaded successfully',
      metadata: {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        bucket: STORAGE_CONFIG.bucketName
      }
    }

  } catch (error) {
    console.error('CV upload error:', error)
    throw error
  }
}

/**
 * Delete CV file from Supabase storage
 * @param {string} filePath - Path to file in storage
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteCV = async (filePath) => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, returning mock success response')
      return {
        success: true,
        message: 'File deleted successfully (mock mode)'
      }
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucketName)
      .remove([filePath])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }

    return {
      success: true,
      message: 'File deleted successfully',
      deletedFiles: data
    }

  } catch (error) {
    console.error('CV deletion error:', error)
    throw error
  }
}

/**
 * List uploaded CV files
 * @param {string} prefix - Path prefix to filter files
 * @returns {Promise<Array>} - List of files
 */
export const listCVFiles = async (prefix = 'cv-uploads/') => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, returning empty list')
      return []
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucketName)
      .list(prefix, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      throw new Error(`List files failed: ${error.message}`)
    }

    return data || []

  } catch (error) {
    console.error('List CV files error:', error)
    throw error
  }
}

/**
 * Get file metadata
 * @param {string} filePath - Path to file in storage
 * @returns {Promise<Object>} - File metadata
 */
export const getCVMetadata = async (filePath) => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, returning mock metadata')
      return {
        name: filePath.split('/').pop(),
        size: 1024 * 1024,
        type: 'application/pdf',
        lastModified: Date.now()
      }
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucketName)
      .list('', {
        search: filePath.split('/').pop()
      })

    if (error) {
      throw new Error(`Get metadata failed: ${error.message}`)
    }

    return data?.[0] || null

  } catch (error) {
    console.error('Get CV metadata error:', error)
    throw error
  }
}

/**
 * Download CV file
 * @param {string} filePath - Path to file in storage
 * @returns {Promise<Blob>} - File blob
 */
export const downloadCV = async (filePath) => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured - cannot download files in mock mode')
    }

    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucketName)
      .download(filePath)

    if (error) {
      throw new Error(`Download failed: ${error.message}`)
    }

    return data

  } catch (error) {
    console.error('Download CV error:', error)
    throw error
  }
}

// Export configuration for external use
export { STORAGE_CONFIG }