# AGENTS.md – LCMS-API (Hệ thống CSDL SHTT Bắc Ninh)

Tài liệu này hướng dẫn Codex khi làm việc trong repository này.
**Đọc toàn bộ file này trước khi thực hiện bất kỳ thay đổi nào.**

---

## 1. Tổng quan dự án

**Tên:** LCMS-API – Local IP Asset Management System  
**Mục đích:** Backend API cho hệ thống quản lý tài sản Sở hữu trí tuệ tỉnh Bắc Ninh  
**Phiên bản tài liệu tham chiếu:** Tai_lieu_tong_quan_CSDL_SHTT_BacNinh.md v1.0

### Các đối tượng SHTT được quản lý

| Mã | Loại | Module |
|----|------|--------|
| `copyright` | Bản quyền tác giả | `src/modules/copyright` |
| `gi` | Chỉ dẫn địa lý | `src/modules/gi` |
| `trademark` | Nhãn hiệu | `src/modules/trademark` |
| `patent` | Sáng chế / GPHI | `src/modules/patent` |
| `design` | Kiểu dáng công nghiệp | `src/modules/design` |
| `craft` | Làng nghề (đặc thù) | `src/modules/craft-village` |

---

## 2. Tech Stack

| Tầng | Công nghệ | Version |
|------|-----------|---------|
| Runtime | Node.js | ≥ 20 LTS |
| Language | TypeScript | 5.x |
| Framework | Express.js | 4.x |
| ORM | TypeORM | 0.3.x |
| Database | MySQL | 8.0+ |
| Auth | JWT (jsonwebtoken) | RS256, access 15m / refresh 7d |
| Validation | class-validator + class-transformer | — |
| Logging | Winston | — |
| Testing | Jest + Supertest | — |
| API Docs | Swagger (swagger-ui-express) | OpenAPI 3.0 |

---

## 3. Cấu trúc thư mục

```
src/
├── config/             # Env, JWT, DB, Swagger config
├── infrastructure/
│   ├── database/       # TypeORM DataSource, migrations
│   ├── logger/         # Winston logger singleton
│   ├── cache/          # Redis client (phase 2)
│   └── storage/        # MinIO/S3 client (phase 2)
├── middleware/         # Auth, RBAC, rate-limit, error handler, audit
├── models/             # TypeORM Entity definitions (mirror schema.sql)
├── modules/            # Feature modules (one per SHTT type + cross-cutting)
│   ├── auth/
│   ├── users/
│   ├── ip-assets/      # Base CRUD cho ip_assets table
│   ├── copyright/
│   ├── trademark/
│   ├── patent/
│   ├── design/
│   ├── gi/
│   ├── craft-village/
│   ├── search/
│   └── dashboard/
├── routes/             # Express router tổng hợp (v1)
├── scripts/            # DB seed, migration runner, import tools
├── shared/
│   ├── constants/      # Enums, HTTP codes, error codes
│   ├── helpers/        # Date utils, pagination, response builder
│   └── validators/     # Custom class-validator decorators
├── types/              # Global TypeScript type augmentations
├── app.ts              # Express app setup
└── server.ts           # HTTP server entrypoint
```

### Quy tắc đặt tên file

- Entity: `PascalCase.entity.ts` (vd: `IpAsset.entity.ts`)
- Repository: `kebab-case.repository.ts`
- Service: `kebab-case.service.ts`
- Controller: `kebab-case.controller.ts`
- DTO: `create-xxx.dto.ts`, `update-xxx.dto.ts`, `query-xxx.dto.ts`
- Route: `xxx.routes.ts`
- Test: `xxx.spec.ts` đặt cạnh file nguồn

---

## 4. Kiến trúc & Pattern

### 4.1 Request flow

```
Request → Router → Middleware (auth/rbac/validate) → Controller → Service → Repository → DB
                                                                ↓
                                                          AuditLog (append-only)
```

### 4.2 Repository Pattern

- Mỗi module có `*.repository.ts` wrap TypeORM repository
- Service KHÔNG gọi TypeORM trực tiếp, chỉ gọi qua Repository
- Repository KHÔNG chứa business logic

### 4.3 Response format chuẩn

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}

// Error
{
  "success": false,
  "error": {
    "code": "ASSET_NOT_FOUND",      // Từ src/shared/constants/error-codes.ts
    "message": "Không tìm thấy đối tượng SHTT",
    "details": {}
  }
}
```

### 4.4 Pagination

Tất cả endpoint danh sách phải dùng `PaginationHelper` từ `src/shared/helpers/pagination.helper.ts`:
```typescript
const { page, limit, offset } = parsePagination(req.query); // default page=1, limit=20, max=100
```

---

## 5. Database

### 5.1 Nguyên tắc

- **KHÔNG** viết raw SQL trong Service/Controller – dùng TypeORM QueryBuilder hoặc Repository method
- **Soft delete** bắt buộc: dùng `@DeleteDateColumn()` (`deleted_at`), không hard-delete trừ Admin
- **Audit columns** bắt buộc trên mọi entity: `created_at`, `updated_at`, `created_by`, `updated_by`
- UUID làm primary key cho tất cả entity SHTT
- Migration: tạo file trong `src/infrastructure/database/migrations/`, KHÔNG tự sửa schema.sql production

### 5.2 Entity base class

Mọi entity SHTT kế thừa `BaseEntity` từ `src/models/base.entity.ts`:
```typescript
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
  @DeleteDateColumn() deleted_at?: Date;
  @Column({ nullable: true }) created_by?: string;
  @Column({ nullable: true }) updated_by?: string;
}
```

### 5.3 Enum asset_type

Giá trị hợp lệ (khớp với `schema.sql`):
```typescript
export enum AssetType {
  COPYRIGHT = 'copyright',
  GI = 'gi',
  TRADEMARK = 'trademark',
  PATENT = 'patent',
  DESIGN = 'design',
  CRAFT = 'craft',
}
```

---

## 6. Authentication & Authorization

### 6.1 JWT

- **Access token:** RS256, TTL 15 phút – header `Authorization: Bearer <token>`
- **Refresh token:** RS256, TTL 7 ngày – lưu trong DB (bảng `refresh_tokens`), rotate mỗi lần dùng
- Keys: `JWT_PRIVATE_KEY` và `JWT_PUBLIC_KEY` (PEM, base64-encoded) trong `.env`
- **KHÔNG** dùng HS256 – phải dùng RS256

### 6.2 Roles

```typescript
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  GUEST = 'guest',  // không có account, chỉ public endpoints
}
```

### 6.3 Middleware thứ tự bắt buộc

```typescript
router.use(rateLimitMiddleware);   // 1. Rate limit trước
router.use(authenticateJWT);       // 2. Xác thực token (optional cho public)
router.use(authorizeRoles(...));   // 3. Kiểm tra role
router.use(auditLogMiddleware);    // 4. Ghi audit log sau auth
```

### 6.4 Rate limit

- Guest (public): 60 req/phút/IP
- Authenticated: 300 req/phút/IP
- Login endpoint: 10 req/15phút/IP (chống brute force)

---

## 7. Error Handling

### 7.1 Throw exception chuẩn

```typescript
import { AppError } from '@/shared/helpers/app-error';
throw new AppError('ASSET_NOT_FOUND', 404, 'Không tìm thấy đối tượng SHTT');
```

### 7.2 Error codes

Tất cả error code định nghĩa trong `src/shared/constants/error-codes.ts`.  
**Không** dùng string literal trực tiếp trong controller/service.

### 7.3 Global error handler

`src/middleware/error-handler.middleware.ts` bắt tất cả lỗi:
- `AppError` → format chuẩn + HTTP status tương ứng
- `QueryFailedError` (TypeORM) → 500 với log chi tiết (không lộ SQL ra client)
- Unhandled → 500 + alert

---

## 8. Logging

Sử dụng logger từ `src/infrastructure/logger/logger.ts`:

```typescript
import { logger } from '@/infrastructure/logger/logger';

logger.info('Message', { context: 'ServiceName', data: {...} });
logger.error('Error', { context: 'ServiceName', error: err.message, stack: err.stack });
```

**Không** dùng `console.log` trong production code.  
Log levels: `error > warn > info > http > debug`

---

## 9. Audit Log

Mọi thao tác CREATE/UPDATE/DELETE của Staff/Admin phải ghi vào bảng `audit_logs`:

```typescript
// Service tự động ghi qua AuditLogService
await this.auditService.log({
  userId: currentUser.id,
  action: 'UPDATE',          // CREATE | UPDATE | SOFT_DELETE | HARD_DELETE | RESTORE
  entityType: 'ip_assets',
  entityId: asset.id,
  oldValue: beforeData,
  newValue: afterData,
  ipAddress: req.ip,
});
```

**Audit log là append-only** – KHÔNG có endpoint UPDATE/DELETE audit log, kể cả Admin.

---

## 10. Validation

Dùng DTO + `class-validator` cho mọi request body và query params:

```typescript
// Controller
const dto = plainToInstance(CreateIpAssetDto, req.body);
const errors = await validate(dto);
if (errors.length) throw new AppError('VALIDATION_ERROR', 422, formatValidationErrors(errors));
```

Custom validators (Vietnamese phone, VN district code...) đặt trong `src/shared/validators/`.

---

## 11. Environment Variables

File `.env` (KHÔNG commit), copy từ `.env.example`:

```env
# Server
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database (MySQL 8.0+)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=shtt_bacninh
DB_USER=
DB_PASS=
DB_POOL_SIZE=10

# JWT (RS256 - PEM keys base64-encoded)
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Rate limiting
RATE_LIMIT_GUEST=60
RATE_LIMIT_AUTH=300
RATE_LIMIT_LOGIN=10

# File Upload
UPLOAD_MAX_SIZE_MB=20
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,pdf,docx

# Redis (Phase 2)
REDIS_URL=redis://localhost:6379

# MinIO (Phase 2)
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=shtt-bacninh
```

---

## 12. Scripts

```bash
npm run dev          # Dev server với ts-node-dev (hot reload)
npm run build        # Compile TypeScript → dist/
npm run start        # Chạy từ dist/ (production)
npm run test         # Jest unit tests
npm run test:e2e     # Integration tests
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run db:migrate   # Chạy TypeORM migrations
npm run db:seed      # Seed reference data (tỉnh, huyện, phân loại)
npm run db:rollback  # Rollback migration cuối
```

---

## 13. Quy tắc Commit

Theo **Conventional Commits**:

```
feat(auth): add refresh token rotation
fix(trademark): correct Nice class validation
docs(api): update swagger for search endpoint
refactor(ip-assets): extract pagination logic
test(copyright): add unit tests for create service
chore: update dependencies
```

---

## 14. API Versioning & Endpoints tổng quan

Base URL: `/api/v1`

| Group | Endpoint | Auth |
|-------|----------|------|
| Auth | `POST /auth/login` | Public |
| Auth | `POST /auth/refresh` | Public |
| Auth | `POST /auth/logout` | Staff+ |
| Public Search | `GET /search` | Public |
| IP Assets | `GET /ip-assets` | Public |
| IP Assets | `GET /ip-assets/:id` | Public |
| IP Assets | `POST /ip-assets` | Staff+ |
| IP Assets | `PATCH /ip-assets/:id` | Staff+ |
| IP Assets | `DELETE /ip-assets/:id` | Staff+ |
| Copyright | `GET /copyright/:id` | Public |
| Trademark | `GET /trademark/:id` | Public |
| Patent | `GET /patent/:id` | Public |
| Design | `GET /design/:id` | Public |
| GI | `GET /gi/:id` | Public |
| Craft Village | `GET /craft-villages` | Public |
| Users | `GET /users` | Admin |
| Users | `POST /users` | Admin |
| Dashboard | `GET /dashboard/stats` | Staff+ |
| Dashboard | `GET /dashboard/expiring` | Staff+ |

---

## 15. Checklist trước khi merge PR

- [ ] TypeScript compile không có lỗi (`npm run build`)
- [ ] ESLint pass (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] Không có `console.log` trong code
- [ ] Không có secret/key hardcode
- [ ] DTO có đầy đủ validation decorators
- [ ] Endpoint mới có Swagger `@ApiOperation` decoration
- [ ] Thao tác write có audit log
- [ ] Migration file tạo nếu thay đổi schema
