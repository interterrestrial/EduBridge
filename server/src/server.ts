// Load environment variables before importing the application.  app.ts creates
// the CORS configuration and Prisma client is imported by route controllers.
import 'dotenv/config';
import app from './app';
import prisma from './prisma';

const PORT = process.env.PORT || 5000;

const start = async (): Promise<void> => {
  try {
    // Do not report a running service when it cannot serve any authenticated
    // endpoint. This also leaves the actionable Prisma error in Render logs.
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to the database. Check DATABASE_URL and the database service.', error);
    process.exit(1);
  }
};

void start();
