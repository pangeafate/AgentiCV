/**
 * Mock Data Factory Functions
 * Following GL-TESTING-GUIDELINES.md
 * 
 * This module provides comprehensive factory functions for creating test data
 * with the goal of reducing test setup boilerplate by 50%.
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
 * @returns {File} Mock file object with proper text() method
 */
export function createMockFile(overrides = {}) {
  const defaults = {
    name: 'test-cv.pdf',
    type: 'application/pdf',
    size: 1024 * 1024, // 1MB
    lastModified: Date.now(),
    content: 'mock file content'
  };
  
  const props = { ...defaults, ...overrides };
  
  // Create file with specified content - allow explicit empty string
  const fileContent = props.content !== undefined ? props.content : 'mock file content';
  const file = new File([fileContent], props.name, {
    type: props.type,
    lastModified: props.lastModified
  });
  
  // Override size property to match what was requested
  Object.defineProperty(file, 'size', {
    value: props.size,
    writable: false,
    configurable: true
  });
  
  // Mock the text() method to return the content
  file.text = jest.fn().mockResolvedValue(fileContent);
  
  return file;
}

/**
 * Create mock user data
 * @param {Object} overrides - Custom properties to override defaults
 * @returns {Object} Mock user data
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'mock-user-id-789',
    email: 'user@example.com',
    name: 'John User',
    role: 'job_seeker',
    created_at: new Date().toISOString(),
    profile: {
      phone: '+1234567890',
      location: 'Remote',
      preferred_job_types: ['full-time'],
      experience_level: 'mid-level'
    },
    settings: {
      notifications: {
        email: true,
        job_alerts: true
      }
    },
    ...overrides
  };
}

/**
 * Create mock API response
 * @param {Object} data - Response data
 * @param {Object} options - Response options (status, headers, etc.)
 * @returns {Object} Mock API response
 */
export function createMockApiResponse(data, options = {}) {
  const {
    status = 200,
    statusText = 'OK',
    headers = {},
    delay = 0
  } = options;

  const response = {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers(headers),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    clone: () => response
  };

  if (delay > 0) {
    return new Promise(resolve => setTimeout(() => resolve(response), delay));
  }

  return Promise.resolve(response);
}

/**
 * Create mock upload progress event
 * @param {number} loaded - Bytes loaded
 * @param {number} total - Total bytes
 * @returns {Object} Mock progress event
 */
export function createMockProgressEvent(loaded, total) {
  return {
    lengthComputable: true,
    loaded,
    total,
    type: 'progress',
    target: {
      status: loaded < total ? 0 : 200,
      readyState: loaded < total ? 1 : 4
    }
  };
}

/**
 * Create mock form data for testing form submissions
 * @param {Object} fields - Form fields as key-value pairs
 * @returns {FormData} Mock FormData object
 */
export function createMockFormData(fields = {}) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach(item => formData.append(key, item));
    } else {
      formData.append(key, String(value));
    }
  });
  return formData;
}

/**
 * Factory for creating multiple related test data items
 */
export const TestDataFactory = {
  /**
   * Create a complete CV-JD-Analysis scenario
   * @param {Object} overrides - Overrides for each component
   * @returns {Object} Complete test scenario
   */
  createCompleteScenario: (overrides = {}) => {
    const cv = createMockCV(overrides.cv);
    const jd = createMockJobDescription(overrides.jd);
    const analysis = createMockAnalysis({
      cvId: cv.id,
      jdId: jd.id,
      ...overrides.analysis
    });
    const user = createMockUser(overrides.user);

    return { cv, jd, analysis, user };
  },

  /**
   * Create multiple CVs with different skill sets
   * @param {number} count - Number of CVs to create
   * @returns {Array} Array of mock CVs
   */
  createMultipleCVs: (count = 3) => {
    const skillSets = [
      ['React', 'JavaScript', 'CSS'],
      ['Python', 'Django', 'PostgreSQL'],
      ['Java', 'Spring', 'MySQL'],
      ['Node.js', 'Express', 'MongoDB'],
      ['Angular', 'TypeScript', 'RxJS']
    ];

    return Array.from({ length: count }, (_, index) => 
      createMockCV({
        id: `cv-${index + 1}`,
        name: `Developer ${index + 1}`,
        skills: skillSets[index % skillSets.length]
      })
    );
  },

  /**
   * Create multiple job descriptions with different requirements
   * @param {number} count - Number of JDs to create
   * @returns {Array} Array of mock job descriptions
   */
  createMultipleJDs: (count = 3) => {
    const positions = [
      { title: 'Frontend Developer', skills: ['React', 'JavaScript', 'CSS'] },
      { title: 'Backend Developer', skills: ['Python', 'Django', 'PostgreSQL'] },
      { title: 'Full Stack Developer', skills: ['Node.js', 'React', 'MongoDB'] }
    ];

    return Array.from({ length: count }, (_, index) => {
      const position = positions[index % positions.length];
      return createMockJobDescription({
        id: `jd-${index + 1}`,
        job_title: position.title,
        required_skills: position.skills
      });
    });
  },

  /**
   * Create file upload scenario with progress simulation
   * @param {Object} options - Upload options
   * @returns {Object} Upload test scenario
   */
  createUploadScenario: (options = {}) => {
    const {
      fileSize = 1024 * 1024,
      fileName = 'test-cv.pdf',
      progressSteps = 5,
      uploadDelay = 100
    } = options;

    const file = createMockFile({ name: fileName, size: fileSize });
    const progressEvents = Array.from({ length: progressSteps }, (_, index) => {
      const loaded = Math.floor((fileSize / progressSteps) * (index + 1));
      return createMockProgressEvent(loaded, fileSize);
    });

    const simulateUpload = () => {
      return new Promise((resolve) => {
        let stepIndex = 0;
        const progressInterval = setInterval(() => {
          if (stepIndex < progressEvents.length) {
            // Trigger progress event (in real test, this would be handled by the component)
            stepIndex++;
          } else {
            clearInterval(progressInterval);
            resolve(createMockApiResponse({ path: 'uploads/' + fileName }));
          }
        }, uploadDelay);
      });
    };

    return {
      file,
      progressEvents,
      simulateUpload,
      expectedResponse: { path: 'uploads/' + fileName }
    };
  },

  /**
   * Create error scenarios for testing error handling
   * @param {string} type - Type of error scenario
   * @returns {Object} Error test scenario
   */
  createErrorScenario: (type = 'api') => {
    const scenarios = {
      api: {
        error: new Error('API Error'),
        response: createMockApiResponse(
          { error: 'Internal Server Error' },
          { status: 500, statusText: 'Internal Server Error' }
        )
      },
      network: {
        error: new Error('Network Error'),
        response: Promise.reject(new Error('Failed to fetch'))
      },
      validation: {
        error: new Error('Validation Error'),
        response: createMockApiResponse(
          { errors: { email: 'Email is required' } },
          { status: 400, statusText: 'Bad Request' }
        )
      },
      upload: {
        error: new Error('Upload failed'),
        file: createMockFile({ size: 10 * 1024 * 1024 }), // 10MB file
        response: createMockApiResponse(
          { error: 'File too large' },
          { status: 413, statusText: 'Payload Too Large' }
        )
      }
    };

    return scenarios[type] || scenarios.api;
  }
};