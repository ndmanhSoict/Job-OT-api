import { authRouter } from '@/modules/auth/routes/auth.routes';
import { ipAssetRouter } from '@/modules/ip-assets/routes/ip-asset.routes';
import { Router } from 'express';

export const v1Router = Router();

// Health check
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
v1Router.use('/auth', authRouter);
v1Router.use('/ip-assets', ipAssetRouter);