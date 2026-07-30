import app from './app';
import prisma from './prisma';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT || 5001);

async function start() {
  // Guard: crash loudly if critical environment variables are missing
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret') {
    throw new Error('JWT_SECRET is missing or still using the insecure default value');
  }

  // Verify database is reachable before accepting traffic
  try {
    await prisma.$connect();
    console.log('[EduBridge] Database connected successfully');
  } catch (err) {
    console.error('[EduBridge] Database connection failed:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[EduBridge] API listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('[EduBridge] Failed to start:', error);
  process.exit(1);
});
