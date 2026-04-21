import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env } from '@config/env.config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, context, stack, ...meta }) => {
  const ctx = context ? `[${context}]` : '';
  const stackTrace = stack ? `\n${stack}` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level} ${ctx} ${message}${metaStr}${stackTrace}`;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), logFormat),
  }),
];

if (env.isProd) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(env.log.dir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '90d',
      format: combine(timestamp(), errors({ stack: true }), logFormat),
    }),
    new DailyRotateFile({
      filename: path.join(env.log.dir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      format: combine(timestamp(), logFormat),
    })
  );
}

export const logger = winston.createLogger({
  level: env.log.level,
  transports,
  exitOnError: false,
});