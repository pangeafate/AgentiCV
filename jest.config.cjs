module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/test/setup/supabaseMock.js'],
  setupFilesAfterEnv: ['<rootDir>/test/utils/testSetup.js'],
  moduleNameMapper: {
    '^@/test$': '<rootDir>/test/index.js',
    '^@/test/(.*)$': '<rootDir>/test/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    'import\\.meta\\.env': '<rootDir>/test/mocks/importMetaEnv.js'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.spec.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}',
  ],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|@testing-library)/)'
  ],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  globals: {
    'import.meta': {
      env: {}
    }
  }
};