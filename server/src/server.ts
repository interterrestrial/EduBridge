// Load environment variables before importing the application.  app.ts creates
// the CORS configuration and Prisma client is imported by route controllers.
import 'dotenv/config';
import app from './app';
import prisma from './prisma';

const PORT = Number(process.env.PORT || 5001);

const start = async (): Promise<void> => {
  // Guard: crash loudly with a clear message if critical env vars are missing
  if (!process.env.DATABASE_URL) {
    throw new Error('[EduBridge] DATABASE_URL environment variable is missing');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret') {
    throw new Error('[EduBridge] JWT_SECRET is missing or still using the insecure default value');
  }

  try {
    // Verify the database is reachable before accepting any traffic.
    // This leaves the actionable Prisma error code in Render logs.
    await prisma.$connect();
    console.log('[EduBridge] Database connected successfully');
    app.listen(PORT, () => {
      console.log(`[EduBridge] API listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('[EduBridge] Failed to connect to the database. Check DATABASE_URL and the database service.', error);
    process.exit(1);
  }
};

void start();
