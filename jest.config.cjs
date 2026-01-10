/** @type {import('jest').Config} */
module.exports = {
  // Test-Umgebung
  testEnvironment: 'jsdom',
  
  // Roots für Tests
  roots: ['<rootDir>/tests'],
  
  // Test-Dateien Pattern
  testMatch: [
    '**/*.test.js',
    '**/*.test.ts'
  ],
  
  // TypeScript-Unterstützung
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'ESNext',
        target: 'ES2020',
        esModuleInterop: true,
        allowJs: true,
        skipLibCheck: true
      }
    }],
    '^.+\.jsx?$': 'babel-jest'
  },
  
  // Module-Aliase (post-migration: Point to root directories)
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/core/$1',
    '^@features/(.*)$': '<rootDir>/features/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@ui/(.*)$': '<rootDir>/ui/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
    '^@systems/(.*)$': '<rootDir>/systems/$1',
    '^@render/(.*)$': '<rootDir>/render/$1'
  },
  
  // Setup-Dateien
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage-Konfiguration
  collectCoverage: false,
  collectCoverageFrom: [
    'utils/testable-utils.js',
    'core/**/*.js',
    'features/**/*.js',
    'systems/**/*.js',
    'ui/**/*.js',
    'render/**/*.js',
    '!**/*.d.ts',
    '!**/*.test.js',
    '!**/node_modules/**',
    '!**/dist/**'
  ],

  // Coverage-Verzeichnis
  coverageDirectory: 'coverage',

  // Coverage-Reporter
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],

  // Coverage-Schwellen (für testable-utils.js)
  coverageThreshold: {
    'utils/testable-utils.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Verbose Output
  verbose: true,
  
  // Timeout
  testTimeout: 10000,
  
  // Ignore Patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  
  // Transform Ignore
  transformIgnorePatterns: [
    '/node_modules/'
  ]
};
