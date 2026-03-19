export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgres://localhost:5432/gridiron_iq',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  cfbdApiKey: process.env.CFBD_API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  },

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
} as const;
