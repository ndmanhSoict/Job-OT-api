import { AppDataSource } from '@config/database.config';
import { logger } from '@infrastructure/logger/logger';

export async function connectDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    logger.info('✅ Database connected', { context: 'Database' });
  } catch (error) {
    logger.error('❌ Database connection failed', { context: 'Database', error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database disconnected', { context: 'Database' });
  }
}

export { AppDataSource };