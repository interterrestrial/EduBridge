import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // uuid@14 is a pure-ESM transitive dep (via @langchain/community's faiss.cjs
  // doing require("uuid")). Allow ts-jest to transform it to CJS.
  transformIgnorePatterns: ['node_modules/(?!uuid)'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'ts-jest',
  },
  clearMocks: true,
};

export default config;
