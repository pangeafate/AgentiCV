/**
 * Test Fixtures
 * Realistic test data for integration testing
 */

export const cvs = [
  {
    id: 'cv-001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0123',
    location: 'New York, NY',
    summary: 'Full-stack developer with 7 years of experience in building scalable web applications',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'PostgreSQL'],
    experience: [
      {
        company: 'Tech Solutions Inc',
        position: 'Senior Software Engineer',
        duration: '2020 - Present',
        responsibilities: [
          'Led team of 5 developers in building microservices architecture',
          'Reduced API response time by 40% through optimization',
          'Implemented CI/CD pipeline using GitHub Actions'
        ]
      },
      {
        company: 'StartupXYZ',
        position: 'Software Developer',
        duration: '2017 - 2020',
        responsibilities: [
          'Built React components for e-commerce platform',
          'Developed RESTful APIs using Node.js and Express',
          'Managed PostgreSQL database optimization'
        ]
      }
    ],
    education: [
      {
        degree: 'MS Computer Science',
        institution: 'MIT',
        graduation: '2017'
      }
    ]
  },
  {
    id: 'cv-002',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1-555-0456',
    location: 'San Francisco, CA',
    summary: 'Frontend specialist with expertise in React and modern JavaScript frameworks',
    skills: ['React', 'Vue.js', 'JavaScript', 'CSS', 'HTML', 'Webpack', 'Jest', 'Cypress'],
    experience: [
      {
        company: 'Digital Agency Co',
        position: 'Frontend Developer',
        duration: '2019 - Present',
        responsibilities: [
          'Developed responsive web applications using React',
          'Implemented design systems and component libraries',
          'Achieved 95% test coverage with Jest and Cypress'
        ]
      }
    ],
    education: [
      {
        degree: 'BS Computer Science',
        institution: 'UC Berkeley',
        graduation: '2019'
      }
    ]
  }
];

export const jobDescriptions = [
  {
    id: 'jd-001',
    job_title: 'Senior Full Stack Developer',
    company_name: 'Innovation Labs',
    location: 'New York, NY (Hybrid)',
    required_skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
    preferred_skills: ['Docker', 'Kubernetes', 'GraphQL', 'Redis'],
    required_experience: [
      '5+ years of full-stack development experience',
      'Experience with microservices architecture',
      'Strong understanding of cloud services (AWS preferred)',
      'Experience leading development teams'
    ],
    required_education: [
      'Bachelor\'s degree in Computer Science or related field',
      'Master\'s degree preferred'
    ],
    key_responsibilities: [
      'Design and implement scalable web applications',
      'Lead technical architecture decisions',
      'Mentor junior developers',
      'Collaborate with product and design teams'
    ]
  },
  {
    id: 'jd-002',
    job_title: 'Frontend Engineer',
    company_name: 'TechStart',
    location: 'Remote',
    required_skills: ['React', 'JavaScript', 'CSS', 'HTML', 'Git'],
    preferred_skills: ['TypeScript', 'Next.js', 'Tailwind CSS', 'Jest'],
    required_experience: [
      '3+ years of frontend development',
      'Experience with modern JavaScript frameworks',
      'Understanding of responsive design principles'
    ],
    required_education: [
      'Bachelor\'s degree in Computer Science or equivalent experience'
    ],
    key_responsibilities: [
      'Build user interfaces with React',
      'Ensure cross-browser compatibility',
      'Write maintainable and testable code',
      'Participate in code reviews'
    ]
  }
];

export const analyses = [
  {
    id: 'analysis-001',
    cvId: 'cv-001',
    jdId: 'jd-001',
    match_score: {
      overall: 85,
      skills: 80,
      experience: 90,
      education: 100,
      qualifications: 75
    },
    gaps: ['TypeScript', 'Kubernetes', 'GraphQL'],
    recommendations: [
      'Add TypeScript experience to improve technical match',
      'Gain experience with Kubernetes for container orchestration',
      'Learn GraphQL to meet preferred skills'
    ]
  }
];