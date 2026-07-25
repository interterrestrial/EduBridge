import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import prisma from '../prisma';

const TEST_DB = path.join(__dirname, '..', '..', 'prisma', 'test.db');
const TEST_DB_URL = `file:${TEST_DB}`;

// Point Prisma at the test DB before importing the app
process.env.DATABASE_URL = TEST_DB_URL;
process.env.JWT_SECRET = 'test_secret';
process.env.GEMINI_API_KEY = 'dummy_key_for_test';
// No GROQ keys set -> LlmService falls straight to (mocked) Gemini path

// Mock the LlmService before any controller imports it
jest.mock('../services/llm.service', () => {
  const LlmService = jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockResolvedValue('{"answer":"mocked"}'),
    getModel: jest.fn(),
  }));
  return { LlmService };
});

beforeAll(() => {
  // Push schema into the test DB
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: 'inherit',
  });
});

afterAll(async () => {
  // Release the SQLite file handle before unlinking — on Windows the open
  // Prisma connection otherwise keeps test.db locked (EBUSY).
  await prisma.$disconnect();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});
