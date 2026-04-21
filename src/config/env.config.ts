import 'dotenv/config';
import type { StringValue } from 'ms';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function optionalMs(key: string, defaultValue: StringValue): StringValue {
  return (process.env[key] as StringValue) ?? defaultValue;
}

function optionalNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

export const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  isDev: optional('NODE_ENV', 'development') === 'development',
  isProd: optional('NODE_ENV', 'development') === 'production',

  server: {
    port: optionalNumber('PORT', 3000),
    apiPrefix: optional('API_PREFIX', '/api/v1'),
    corsOrigins: optional('CORS_ORIGINS', 'http://localhost:5173').split(','),
  },

  db: {
    host: optional('DB_HOST', 'localhost'),
    port: optionalNumber('DB_PORT', 3306),
    name: optional('DB_NAME', 'shtt_bacninh'),
    user: optional('DB_USER', 'root'),
    pass: optional('DB_PASS', ''),
    poolSize: optionalNumber('DB_POOL_SIZE', 10),
    logging: optional('DB_LOGGING', 'false') === 'true',
  },

  jwt: {
    privateKey: Buffer.from(optional('JWT_PRIVATE_KEY', ''), 'base64').toString('utf-8') || '',
    publicKey: Buffer.from(optional('JWT_PUBLIC_KEY', ''), 'base64').toString('utf-8') || '',
    accessExpires: optionalMs('JWT_ACCESS_EXPIRES', '15m'),
    refreshExpires: optionalMs('JWT_REFRESH_EXPIRES', '7d'),
  },

  rateLimit: {
    guest: optionalNumber('RATE_LIMIT_GUEST', 60),
    auth: optionalNumber('RATE_LIMIT_AUTH', 300),
    login: optionalNumber('RATE_LIMIT_LOGIN', 10),
  },

  upload: {
    maxSizeMb: optionalNumber('UPLOAD_MAX_SIZE_MB', 20),
    allowedTypes: optional('UPLOAD_ALLOWED_TYPES', 'jpg,jpeg,png,pdf,docx').split(','),
    dest: optional('UPLOAD_DEST', './uploads'),
  },

  log: {
    level: optional('LOG_LEVEL', 'debug'),
    dir: optional('LOG_DIR', './logs'),
  },

  redis: {
    url: optional('REDIS_URL', 'redis://localhost:6379'),
    ttl: optionalNumber('REDIS_TTL', 300),
  },

  minio: {
    endpoint: optional('MINIO_ENDPOINT', ''),
    port: optionalNumber('MINIO_PORT', 9000),
    useSsl: optional('MINIO_USE_SSL', 'false') === 'true',
    accessKey: optional('MINIO_ACCESS_KEY', ''),
    secretKey: optional('MINIO_SECRET_KEY', ''),
    bucket: optional('MINIO_BUCKET', 'shtt-bacninh'),
  },
} as const;