/**
 * Test Fixtures
 * Realistic test data for integration testing
 * Following GL-TESTING-GUIDELINES.md
 */

// Import JSON fixtures for better maintainability
import cvsData from './cvs.json';
import jobDescriptionsData from './job-descriptions.json';
import analysesData from './analyses.json';
import usersData from './users.json';

// Re-export JSON data
export const cvs = cvsData;
export const jobDescriptions = jobDescriptionsData;
export const analyses = analysesData;
export const users = usersData;

/**
 * Fixture utilities for easier test data management
 */
export const FixtureUtils = {
  /**
   * Get CV by ID
   * @param {string} id - CV ID
   * @returns {Object|null} CV data
   */
  getCVById: (id) => cvs.find(cv => cv.id === id) || null,

  /**
   * Get job description by ID
   * @param {string} id - Job description ID
   * @returns {Object|null} Job description data
   */
  getJobDescriptionById: (id) => jobDescriptions.find(jd => jd.id === id) || null,

  /**
   * Get analysis by ID
   * @param {string} id - Analysis ID
   * @returns {Object|null} Analysis data
   */
  getAnalysisById: (id) => analyses.find(analysis => analysis.id === id) || null,

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Object|null} User data
   */
  getUserById: (id) => users.find(user => user.id === id) || null,

  /**
   * Get CVs by skill
   * @param {string} skill - Skill to search for
   * @returns {Array} Array of CVs with the skill
   */
  getCVsBySkill: (skill) => cvs.filter(cv => 
    cv.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
  ),

  /**
   * Get job descriptions by required skill
   * @param {string} skill - Skill to search for
   * @returns {Array} Array of job descriptions requiring the skill
   */
  getJobDescriptionsBySkill: (skill) => jobDescriptions.filter(jd => 
    jd.required_skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
  ),

  /**
   * Get users by role
   * @param {string} role - User role
   * @returns {Array} Array of users with the role
   */
  getUsersByRole: (role) => users.filter(user => user.role === role),

  /**
   * Get analysis by CV and JD combination
   * @param {string} cvId - CV ID
   * @param {string} jdId - Job description ID
   * @returns {Object|null} Analysis data
   */
  getAnalysisByCvAndJd: (cvId, jdId) => analyses.find(analysis => 
    analysis.cvId === cvId && analysis.jdId === jdId
  ) || null,

  /**
   * Create a subset of data for testing
   * @param {string} type - Type of data ('cvs', 'jobDescriptions', 'analyses', 'users')
   * @param {number} count - Number of items to return
   * @returns {Array} Subset of data
   */
  getSubset: (type, count = 2) => {
    const dataMap = {
      cvs,
      jobDescriptions,
      analyses,
      users
    };
    
    const data = dataMap[type] || [];
    return data.slice(0, count);
  },

  /**
   * Get realistic test combinations for CV-JD matching
   * @returns {Array} Array of CV-JD pairs with expected match data
   */
  getMatchingPairs: () => [
    {
      cv: cvs[0], // Sarah Johnson - Full-stack
      jd: jobDescriptions[0], // Senior Full Stack Developer
      expectedMatch: analyses[0],
      matchReason: 'Full-stack developer with matching skills'
    },
    {
      cv: cvs[1], // Michael Chen - Frontend
      jd: jobDescriptions[1], // Frontend Engineer
      expectedMatch: analyses[1],
      matchReason: 'Frontend specialist with React expertise'
    },
    {
      cv: cvs[2], // Emily Rodriguez - Data Scientist
      jd: jobDescriptions[2], // Data Scientist
      expectedMatch: analyses[2],
      matchReason: 'Data scientist with ML experience'
    }
  ],

  /**
   * Generate random test data based on existing patterns
   * @param {string} type - Type of data to generate
   * @param {Object} overrides - Properties to override
   * @returns {Object} Generated test data
   */
  generateTestData: (type, overrides = {}) => {
    const generators = {
      cv: () => ({
        id: `test-cv-${Date.now()}`,
        name: 'Test User',
        email: 'test@example.com',
        skills: ['JavaScript', 'React'],
        experience: [],
        education: [],
        ...overrides
      }),
      jobDescription: () => ({
        id: `test-jd-${Date.now()}`,
        job_title: 'Test Position',
        company_name: 'Test Company',
        required_skills: ['JavaScript'],
        preferred_skills: [],
        ...overrides
      }),
      user: () => ({
        id: `test-user-${Date.now()}`,
        email: 'test@example.com',
        name: 'Test User',
        role: 'job_seeker',
        ...overrides
      }),
      analysis: () => ({
        id: `test-analysis-${Date.now()}`,
        cvId: 'test-cv-id',
        jdId: 'test-jd-id',
        match_score: { overall: 75 },
        gaps: [],
        recommendations: [],
        ...overrides
      })
    };

    const generator = generators[type];
    if (!generator) {
      throw new Error(`Unknown test data type: ${type}`);
    }

    return generator();
  }
};