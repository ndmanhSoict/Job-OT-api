import { Router } from 'express';

export const v1Router = Router();

/**
 * Health check – không cần auth, không rate limit
 */
v1Router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
    },
  });
});

// ─── Feature routes ─────────────────────────────────────────────────────────