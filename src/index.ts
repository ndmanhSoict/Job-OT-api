import 'reflect-metadata'; // Bắt buộc cho TypeORM
import express from 'express';
import cors from 'cors';
import { env } from '@config/env.config';
import { connectDatabase } from '@infrastructure/database';
import { logger } from '@infrastructure/logger/logger';
import { requestLogger } from '@middleware/request-logger.middleware';
import { errorHandler, notFoundHandler } from '@middleware/error-handler.middleware';
import { guestRateLimit } from '@middleware/rate-limit.middleware';
import { v1Router } from './routes';

const app = express();

// 1. Global Middlewares
app.use(cors({ origin: env.server.corsOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(guestRateLimit);

// 2. Định tuyến (Routes)
app.use(env.server.apiPrefix, v1Router);

// 3. Xử lý lỗi (Phải nằm cuối)
app.use(notFoundHandler);
app.use(errorHandler);

// 4. Khởi động Server & Database
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(env.server.port, () => {
      logger.info(`🚀 Server đang chạy tại http://localhost:${env.server.port}${env.server.apiPrefix}`, { context: 'Server' });
    });
  } catch (error) {
    logger.error('Khởi động server thất bại', { context: 'Server', error });
    process.exit(1);
  }
};

startServer();