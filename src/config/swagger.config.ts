import { env } from './env.config';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LCMS-API – Hệ thống CSDL SHTT Bắc Ninh',
      version: '1.0.0',
      description: `
## Mô tả
REST API cho hệ thống quản lý tài sản Sở hữu trí tuệ tỉnh Bắc Ninh.

## Phân quyền
- **Public** – Không cần xác thực (Guest)
- **Staff** – Cần Bearer token, role = staff | admin
- **Admin** – Cần Bearer token, role = admin
      `,
      contact: {
        name: 'LCMS Support',
        email: 'support@bacninh.gov.vn',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.server.port}${env.server.apiPrefix}`,
        description: 'Development',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/modules/**/*.routes.ts'],
};