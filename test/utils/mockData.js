/**
 * Mock Data Factory Functions
 * Following GL-TESTING-GUIDELINES.md
 */

/**
 * Create mock CV data
 * @param {Object} overrides - Custom properties to override defaults
 * @returns {Object} Mock CV data
 */
export function createMockCV(overrides = {}) {
  return {
    id: 'mock-cv-id-123',
    name: 'John Developer',
    email: 'john.developer@example.com',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    summary: 'Experienced software engineer with 5+ years in full-stack development',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
    experience: [
      {
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        duration: '2020 - Present',
        responsibilities: [
          'Led development of React applications',
          'Implemented microservices architecture',
          'Mentored junior developers'
        ]
      }
    ],
    education: [
      {
        degree: 'BS Computer Science',
        institution: 'Stanford University',
        graduation: '2018'
      }
    ],
    ...overrides
  };
}

/**
 * Create mock Job Description data
 * @param {Object} overrides - Custom properties to override defaults
 * @returns {Object} Mock JD data
 */
export function createMockJobDescription(overrides = {}) {
  return {
    id: 'mock-jd-id-456',
    job_title: 'Senior Frontend Developer',
    company_name: 'Awesome Tech Inc',
    location: 'Remote',
    required_skills: ['React', 'TypeScript', 'GraphQL', 'Jest'],
    preferred_skills: ['Next.js', 'AWS', 'Docker'],
    required_experience: [
      '5+ years of frontend development',
      'Experience with React and modern JavaScript',
      'Strong understanding of web performance'
    ],
    required_education: [
      'Bachelor\'s degree in Computer Science or related field'
    ],
    key_responsibilities: [
      'Build and maintain React applications',
      'Collaborate with design and backend teams',
      'Write clean, maintainable code'
    ],
    ...overrides
  };
}

/**
 * Create mock Analysis result
 * @param {Object} overrides - Custom properties to override defaults
 * @returns {Object} Mock analysis data
 */
export function createMockAnalysis(overrides = {}) {
  return {
    cv_highlighting: [
      {
        address: 'skills[0]',
        class: 'highlight-match',
        reason: 'JavaScript is a required skill'
      },
      {
        address: 'skills[1]',
        class: 'highlight-match',
        reason: 'React is a required skill'
      }
    ],
    jd_highlighting: [
      {
        address: 'required_skills[0]',
        class: 'highlight-match',
        reason: 'Candidate has React experience'
      },
      {
        address: 'required_skills[1]',
        class: 'highlight-gap',
        reason: 'Candidate lacks TypeScript experience'
      }
    ],
    match_score: {
      overall: 75,
      skills: 70,
      experience: 80,
      education: 90,
      qualifications: 65
    },
    gaps: ['TypeScript', 'GraphQL', 'Jest'],
    recommendations: [
      'Learn TypeScript to improve match score',
      'Gain experience with GraphQL',
      'Add testing experience with Jest'
    ],
    ...overrides
  };
}

/**
 * Create mock file for upload testing
 * @param {Object} overrides - Custom properties to override defaults
 * @returns {File} Mock file object
 */
export function createMockFile(overrides = {}) {
  const defaults = {
    name: 'test-cv.pdf',
    type: 'application/pdf',
    size: 1024 * 1024, // 1MB
    lastModified: Date.now()
  };
  
  const props = { ...defaults, ...overrides };
  
  return new File(['mock file content'], props.name, {
    type: props.type,
    lastModified: props.lastModified
  });
}