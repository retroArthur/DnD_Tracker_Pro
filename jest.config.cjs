/** @type {import('jest').Config} */
module.exports = {
  // Test-Umgebung
  testEnvironment: 'jsdom',
  
  // Roots für Tests
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  
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
  
  // Module-Aliase (TypeScript Migration: Point to src/)
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@systems/(.*)$': '<rootDir>/src/systems/$1',
    '^@render/(.*)$': '<rootDir>/src/render/$1'
  },
  
  // Setup-Dateien
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage-Konfiguration
  collectCoverage: false,
  collectCoverageFrom: [
    'utils/testable-utils.js',
    'src/**/*.ts',
    '!src/**/*.d.ts',
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
