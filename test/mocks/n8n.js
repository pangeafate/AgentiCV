/**
 * N8N/Flowise Mock Factory
 * Following GL-TESTING-GUIDELINES.md
 */

export const N8NMockFactory = {
  /**
   * Create a gap analysis mock
   * @param {Object} analysisData - Analysis result data
   * @returns {Object} Mocked N8N response
   */
  createGapAnalysisMock: (analysisData = {}) => ({
    predict: jest.fn(() => Promise.resolve({
      success: true,
      output: JSON.stringify({
        cv_highlighting: analysisData.cv_highlighting || [],
        jd_highlighting: analysisData.jd_highlighting || [],
        match_score: analysisData.matchScore || {
          overall: 75,
          skills: 70,
          experience: 80,
          education: 90,
          qualifications: 65
        },
        gaps: analysisData.gaps || [],
        recommendations: analysisData.recommendations || []
      })
    }))
  }),

  /**
   * Create a CV parser mock
   * @param {Object} extractedData - Extracted CV data
   * @returns {Object} Mocked N8N response
   */
  createCVParserMock: (extractedData = {}) => ({
    predict: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        personal: extractedData.personal || {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        },
        skills: extractedData.skills || ['React', 'Node.js'],
        experience: extractedData.experience || 5,
        education: extractedData.education || 'BS Computer Science',
        ...extractedData
      }
    }))
  }),

  /**
   * Create a JD parser mock
   * @param {Object} parsedData - Parsed JD data
   * @returns {Object} Mocked N8N response
   */
  createJDParserMock: (parsedData = {}) => ({
    predict: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        title: parsedData.title || 'Senior Developer',
        requiredSkills: parsedData.requiredSkills || ['React', 'TypeScript'],
        preferredSkills: parsedData.preferredSkills || ['AWS', 'Docker'],
        experience: parsedData.experience || '5+ years',
        ...parsedData
      }
    }))
  }),

  /**
   * Create an error mock
   * @param {string} errorMessage - Error message
   * @returns {Object} Mocked N8N error response
   */
  createErrorMock: (errorMessage = 'N8N webhook error') => ({
    predict: jest.fn(() => Promise.reject(new Error(errorMessage)))
  }),

  /**
   * Create a webhook mock
   * @param {Object} config - Webhook configuration
   * @returns {Object} Mocked webhook response
   */
  createWebhookMock: ({ endpoint, response }) => ({
    post: jest.fn((url, data) => {
      if (url.includes(endpoint)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(response)
        });
      }
      return Promise.reject(new Error('Webhook not found'));
    })
  })
};