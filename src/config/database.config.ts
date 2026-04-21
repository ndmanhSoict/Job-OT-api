import { DataSource, DataSourceOptions } from 'typeorm';
import { env } from './env.config';

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  username: env.db.user,
  password: env.db.pass,
  charset: 'utf8mb4',
  timezone: '+07:00',
  synchronize: false,           // NEVER true in production – use migrations
  logging: env.db.logging,
  entities: [__dirname + '/../models/**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../infrastructure/database/migrations/**/*.{ts,js}'],
  migrationsTableName: 'typeorm_migrations',
  extra: {
    connectionLimit: env.db.poolSize,
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);