import { authRouter } from '@/modules/auth/routes/auth.routes';
import { importExportRouter } from '@/modules/import-export/routes/import-export.routes';
import { ipAssetRouter } from '@/modules/ip-assets/routes/ip-asset.routes';
import { searchRouter } from '@/modules/search/routes/search.routes';
import { userRouter } from '@/modules/users/routes/user.routes';
import { craftVillageRouter } from '@/modules/craft-village/routes/craft-village.routes';
import { dashboardRouter } from '@/modules/dashboard/routes/dashboard.routes';
import { refRouter } from '@/modules/ref/routes/ref.routes';
import { organizationRouter } from '@/modules/organizations/routes/organization.routes';
import { personRouter } from '@/modules/persons/routes/person.routes';
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
v1Router.use('/search', searchRouter);
v1Router.use('/', importExportRouter);
v1Router.use('/users', userRouter);
v1Router.use('/craft-villages', craftVillageRouter);
v1Router.use('/dashboard', dashboardRouter);
v1Router.use('/ref', refRouter);
v1Router.use('/organizations', organizationRouter);
v1Router.use('/persons', personRouter);
