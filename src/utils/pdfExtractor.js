/**
 * Extract text from PDF using PDF.js
 * Note: For production, you might want to use a server-side solution
 */

export async function extractTextFromPDF(file) {
  // For now, we'll return a message that PDF parsing needs to be done server-side
  // In production, you'd use a library like pdf.js or send to a backend service
  
  return `[PDF File: ${file.name}]\n[Note: PDF text extraction needs server-side processing or a PDF.js implementation]\n[File size: ${file.size} bytes]`;
}

/**
 * Extract text from various file types
 */
export async function extractTextFromFile(file) {
  const fileType = file.type;
  
  if (fileType === 'text/plain') {
    // Text files can be read directly
    return await file.text();
  }
  
  if (fileType === 'application/pdf') {
    // PDFs need special handling
    return await extractTextFromPDF(file);
  }
  
  if (fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    // Word docs need special handling
    return `[Word Document: ${file.name}]\n[Note: Word document extraction needs server-side processing]\n[File size: ${file.size} bytes]`;
  }
  
  // Default: try to read as text
  try {
    return await file.text();
  } catch (error) {
    return `[Unable to extract text from file: ${file.name}]`;
  }
}