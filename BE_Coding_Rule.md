# QUY TẮC LẬP TRÌNH BACKEND – HỆ THỐNG CSDL SHTT BẮC NINH

> **Áp dụng cho:** Tất cả developer BE  
> **Tech stack:** Node.js 20+ · TypeScript 5 · Express 4 · TypeORM 0.3 · MySQL 8  
> **Phiên bản tài liệu:** 1.0 – 22/04/2026  
> **Nguyên tắc cốt lõi:** Code phải nhất quán, có thể đọc hiểu, dễ review và dễ test

---

## MỤC LỤC

1. [Cấu trúc thư mục](#1-cấu-trúc-thư-mục)
2. [Quy ước đặt tên](#2-quy-ước-đặt-tên)
3. [Response chuẩn](#3-response-chuẩn)
4. [Xử lý lỗi (Error Handling)](#4-xử-lý-lỗi-error-handling)
5. [Validation – DTO](#5-validation--dto)
6. [Authentication & Authorization (RBAC)](#6-authentication--authorization-rbac)
7. [Rate Limiting](#7-rate-limiting)
8. [Audit Log](#8-audit-log)
9. [Entity & Database](#9-entity--database)
10. [Service Layer](#10-service-layer)
11. [Repository Layer](#11-repository-layer)
12. [Controller Layer](#12-controller-layer)
13. [Route Layer](#13-route-layer)
14. [Phân trang (Pagination)](#14-phân-trang-pagination)
15. [Upload File](#15-upload-file)
16. [Biến môi trường (Env Config)](#16-biến-môi-trường-env-config)
17. [Logging](#17-logging)
18. [Bảo mật](#18-bảo-mật)
19. [Checklist tạo API mới](#19-checklist-tạo-api-mới)

---

## 1. Cấu trúc thư mục

```
src/
├── config/
│   ├── database.config.ts      # TypeORM DataSource
│   ├── env.config.ts           # Đọc & validate biến môi trường
│   └── swagger.config.ts       # Swagger UI setup
│
├── infrastructure/
│   ├── database/index.ts       # Khởi tạo AppDataSource
│   └── logger/logger.ts        # Winston logger instance
│
├── middleware/
│   ├── auth.middleware.ts       # JWT verify, requireAuth, authorizeRoles
│   ├── audit-log.middleware.ts  # writeAuditLog(), getClientIp()
│   ├── error-handler.middleware.ts  # Global error handler, 404 handler
│   ├── rate-limit.middleware.ts # guestRateLimit, authRateLimit, loginRateLimit
│   ├── validate.middleware.ts   # validateBody(), validateQuery()
│   └── request-logger.middleware.ts # HTTP access log
│
├── models/
│   ├── base.entity.ts          # BaseEntity (id, created_at, updated_at, deleted_at, created_by, updated_by)
│   ├── ip-asset.entity.ts      # IpAsset entity
│   ├── detail-entities.ts      # CopyrightDetail, TrademarkDetail, PatentDetail, DesignDetail, GiDetail
│   ├── craft-village.entity.ts # CraftVillage entity
│   ├── user.entity.ts          # User entity
│   ├── refresh-token.entity.ts # RefreshToken entity
│   ├── asset-image.entity.ts   # AssetImage entity
│   └── audit-log.entity.ts     # AuditLog entity
│
├── modules/
│   └── <feature>/              # Một folder per feature (auth, ip-assets, users, ...)
│       ├── controllers/
│       │   └── <feature>.controller.ts
│       ├── services/
│       │   └── <feature>.service.ts
│       ├── repositories/
│       │   └── <feature>.repository.ts
│       └── dto/
│           └── <feature>.dto.ts
│
├── routes/
│   └── index.ts                # Mount tất cả router vào v1Router
│
├── shared/
│   ├── constants/
│   │   ├── enums.ts            # Tất cả enum dùng chung
│   │   └── error-codes.ts      # ErrorCode object
│   └── helpers/
│       ├── app-error.ts        # Class AppError
│       ├── response.helper.ts  # sendSuccess, sendCreated, sendNoContent
│       └── pagination.helper.ts # parsePagination, buildPaginationMeta
│
└── index.ts                    # Entry point – khởi động Express app
```

**Quy tắc:**
- Mỗi feature là một folder độc lập trong `modules/`.
- Không import chéo giữa các modules (A không import từ B). Dùng shared nếu cần dùng chung.
- Không để logic nghiệp vụ trong controller hay route.

---

## 2. Quy ước đặt tên

### File & Folder

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Folder | `kebab-case` | `ip-assets/`, `craft-villages/` |
| File Entity | `kebab-case.entity.ts` | `ip-asset.entity.ts` |
| File Service | `kebab-case.service.ts` | `ip-asset.service.ts` |
| File Controller | `kebab-case.controller.ts` | `ip-asset.controller.ts` |
| File Repository | `kebab-case.repository.ts` | `ip-asset.repository.ts` |
| File DTO | `kebab-case.dto.ts` | `create-ip-asset.dto.ts` |
| File Middleware | `kebab-case.middleware.ts` | `auth.middleware.ts` |

### Code

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Class | `PascalCase` | `IpAssetService`, `CreateIpAssetDto` |
| Interface | `PascalCase` | `TokenPair`, `AuditLogPayload` |
| Enum | `PascalCase` (keys `UPPER_CASE`) | `AssetType.TRADEMARK` |
| Function / Method | `camelCase` | `findById()`, `softDelete()` |
| Variable | `camelCase` | `const accessToken` |
| DB column / JSON field | `snake_case` | `application_number`, `created_at` |
| Env variable | `SCREAMING_SNAKE_CASE` | `JWT_PRIVATE_KEY`, `DB_HOST` |
| Route path | `kebab-case` | `/ip-assets`, `/craft-villages` |
| Const object export | `PascalCase` (object) | `export const IpAssetController = { ... }` |

---

## 3. Response chuẩn

> **Quy tắc vàng:** Không bao giờ gọi `res.json()` trực tiếp trong controller. Luôn dùng helper.

### Các helper có sẵn (`src/shared/helpers/response.helper.ts`)

```typescript
// HTTP 200 – trả data (dùng cho GET single, PATCH, POST auth)
sendSuccess(res, data);

// HTTP 200 – trả data + pagination meta (dùng cho GET list)
sendSuccess(res, data, 200, meta);

// HTTP 201 – vừa tạo mới (POST create)
sendCreated(res, data);

// HTTP 204 – không có body (DELETE)
sendNoContent(res);
```

### Cấu trúc JSON response

**Thành công (có data):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Thành công (có phân trang):**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Lỗi:**
```json
{
  "success": false,
  "error": {
    "code": "ASSET_NOT_FOUND",
    "message": "Không tìm thấy đối tượng SHTT",
    "details": {}
  }
}
```

### Mapping HTTP Status → Tình huống

| Status | Dùng khi |
|--------|---------|
| 200 | GET thành công, PATCH thành công, POST (auth/logout/restore) thành công |
| 201 | POST tạo mới resource thành công |
| 204 | DELETE thành công (không trả body) |
| 400 | Validate sai format/type (class-validator) |
| 401 | Chưa đăng nhập, token sai/hết hạn |
| 403 | Đã đăng nhập nhưng không đủ quyền |
| 404 | Resource không tồn tại |
| 409 | Conflict – trùng unique (số đơn, email, username) |
| 422 | Dữ liệu đúng format nhưng vi phạm logic nghiệp vụ |
| 429 | Vượt rate limit |
| 500 | Lỗi server không mong đợi |

---

## 4. Xử lý lỗi (Error Handling)

### Nguyên tắc

- Mọi lỗi phải được `throw` dưới dạng `AppError` hoặc lan truyền qua `next(err)`.
- **Không bao giờ** dùng `try/catch` để nuốt lỗi mà không xử lý.
- Controller luôn bọc trong `try/catch` và gọi `next(err)` trong catch.
- Service ném `AppError` với đúng `ErrorCode` và `statusCode`.

### Class `AppError` (`src/shared/helpers/app-error.ts`)

```typescript
throw new AppError(
  ErrorCode.ASSET_NOT_FOUND,  // ErrorCode từ error-codes.ts
  404,                         // HTTP status code
  'Không tìm thấy đối tượng SHTT',  // Message hiển thị cho client
  { id: req.params.id }        // details (optional) – debug info
);
```

### Cách dùng trong Service

```typescript
// ✅ Đúng
async getById(id: string): Promise<IpAsset> {
  const asset = await this.repo.findById(id);
  if (!asset) {
    throw new AppError(ErrorCode.ASSET_NOT_FOUND, 404, 'Không tìm thấy đối tượng SHTT');
  }
  return asset;
}

// ❌ Sai – không ném AppError, response format không nhất quán
async getById(id: string) {
  const asset = await this.repo.findById(id);
  if (!asset) return null; // Controller phải tự xử lý null → dễ quên
}
```

### Cách dùng trong Controller

```typescript
// ✅ Đúng
async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const asset = await service.getById(req.params.id);
    sendSuccess(res, asset);
  } catch (err) {
    next(err); // Chuyển cho global error handler
  }
}
```

### Global Error Handler (`src/middleware/error-handler.middleware.ts`)

Đã xử lý tự động các loại lỗi sau — dev **không cần** tự catch lại:

| Loại lỗi | Xử lý |
|----------|-------|
| `AppError` | Trả response với `statusCode` và `code` tương ứng |
| `QueryFailedError` (TypeORM) với `ER_DUP_ENTRY` | Tự động trả 409 CONFLICT |
| Mọi lỗi khác | Trả 500 INTERNAL_SERVER_ERROR, log stack trace |

---

## 5. Validation – DTO

### Nguyên tắc

- Mọi input (body, query) đều phải có DTO class riêng với decorator `class-validator`.
- Dùng middleware `validateBody(Dto)` và `validateQuery(Dto)` – không tự validate thủ công.
- DTO class đặt trong `modules/<feature>/dto/`.

### Cách khai báo DTO

```typescript
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, MaxLength, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { AssetType, AssetStatus } from '@shared/constants/enums';

export class CreateIpAssetDto {
  // Trường bắt buộc
  @IsEnum(AssetType, { message: 'asset_type không hợp lệ' })
  asset_type: AssetType;

  @IsString()
  @IsNotEmpty({ message: 'Tên đối tượng không được để trống' })
  @MaxLength(500)
  title: string;

  // Trường không bắt buộc
  @IsOptional()
  @IsDateString({}, { message: 'application_date phải là ISO 8601 (YYYY-MM-DD)' })
  application_date?: string;

  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;
}

export class QueryIpAssetDto {
  @IsOptional()
  @Type(() => Number)   // Bắt buộc có @Type để class-transformer convert string → number
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
```

### Cách dùng trong Route

```typescript
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { CreateIpAssetDto, UpdateIpAssetDto } from '../dto/create-ip-asset.dto';
import { QueryIpAssetDto } from '../dto/query-ip-asset.dto';

router.get('/',
  guestRateLimit,
  validateQuery(QueryIpAssetDto),   // Validate query params
  IpAssetController.list
);

router.post('/',
  authRateLimit,
  requireAuth,
  authorizeRoles(UserRole.STAFF, UserRole.ADMIN),
  validateBody(CreateIpAssetDto),   // Validate request body
  IpAssetController.create
);
```

### Quy tắc validate bổ sung (nghiệp vụ)

Những rule không thể diễn tả bằng decorator thì validate trong **Service**, ném `AppError(ErrorCode.UNPROCESSABLE_ENTITY, 422, ...)`:

```typescript
// Ví dụ: publication_date phải >= application_date
if (dto.publication_date && dto.application_date) {
  if (new Date(dto.publication_date) < new Date(dto.application_date)) {
    throw new AppError(
      ErrorCode.UNPROCESSABLE_ENTITY,
      422,
      'Ngày công bố phải lớn hơn hoặc bằng ngày nộp đơn'
    );
  }
}
```

---

## 6. Authentication & Authorization (RBAC)

### Middleware có sẵn (`src/middleware/auth.middleware.ts`)

```typescript
authenticateJWT   // Optional auth – đọc token nếu có, không có thì bỏ qua (req.user = undefined)
requireAuth       // Bắt buộc phải có token hợp lệ → 401 nếu không có
authorizeRoles()  // Kiểm tra role sau requireAuth → 403 nếu sai role
```

### Cách áp dụng trong Route

```typescript
import { authenticateJWT, requireAuth, authorizeRoles } from '@middleware/auth.middleware';
import { UserRole } from '@shared/constants/enums';

// Public route – không cần đăng nhập
router.get('/', guestRateLimit, IpAssetController.list);

// Cần đăng nhập, bất kỳ role
router.get('/dashboard/stats', authRateLimit, requireAuth, DashboardController.stats);

// Chỉ Staff hoặc Admin
router.post('/', authRateLimit, requireAuth, authorizeRoles(UserRole.STAFF, UserRole.ADMIN), IpAssetController.create);

// Chỉ Admin
router.delete('/:id/hard', authRateLimit, requireAuth, authorizeRoles(UserRole.ADMIN), IpAssetController.hardDelete);
```

### Truy cập thông tin user trong Controller/Service

```typescript
// Trong controller – req.user được inject bởi authenticateJWT
req.user!.id       // UUID user
req.user!.role     // UserRole.ADMIN | UserRole.STAFF
req.user!.username
req.user!.email
```

> **Lưu ý:** Chỉ dùng `req.user!` (non-null assertion) sau khi đã đặt `requireAuth` trong middleware chain.

### Ma trận phân quyền

| Hành động | Guest | Staff | Admin |
|-----------|:-----:|:-----:|:-----:|
| GET (public list/detail) | ✅ | ✅ | ✅ |
| POST (create) | ❌ | ✅ | ✅ |
| PATCH (update) | ❌ | ✅ | ✅ |
| DELETE (soft delete) | ❌ | ✅ | ✅ |
| DELETE /hard | ❌ | ❌ | ✅ |
| POST /restore | ❌ | ❌ | ✅ |
| Quản lý users | ❌ | ❌ | ✅ |
| Dashboard | ❌ | ✅ | ✅ |
| Export | ❌ | ✅ | ✅ |
| Import | ❌ | ✅ | ✅ |

---

## 7. Rate Limiting

### Middleware có sẵn (`src/middleware/rate-limit.middleware.ts`)

| Middleware | Giới hạn | Dùng cho |
|-----------|---------|---------|
| `guestRateLimit` | 60 req/phút/IP | Tất cả public GET endpoints |
| `authRateLimit` | 300 req/phút/IP | Tất cả endpoints cần đăng nhập |
| `loginRateLimit` | 10 req/15 phút/IP | `POST /auth/login` – chống brute force |

### Cách đặt trong route

```typescript
// ✅ Đúng – luôn đặt rate limit TRƯỚC validate và handler
router.post('/auth/login',
  loginRateLimit,          // 1. Rate limit
  validateBody(LoginDto),  // 2. Validate
  AuthController.login     // 3. Handler
);

router.get('/ip-assets',
  guestRateLimit,              // 1. Rate limit
  validateQuery(QueryDto),     // 2. Validate
  IpAssetController.list       // 3. Handler
);
```

> **Quy tắc:** Mọi route đều phải có rate limit – không có route nào thiếu.

---

## 8. Audit Log

### Khi nào phải ghi audit log

| Action | Ghi log |
|--------|---------|
| `LOGIN` | ✅ Sau đăng nhập thành công |
| `LOGOUT` | ✅ Sau đăng xuất |
| `CREATE` | ✅ Sau tạo bản ghi |
| `UPDATE` | ✅ Sau cập nhật (phải có cả `oldValue` và `newValue`) |
| `SOFT_DELETE` | ✅ Sau xóa mềm (phải có `oldValue`) |
| `HARD_DELETE` | ✅ Sau xóa cứng (phải có `oldValue`) |
| `RESTORE` | ✅ Sau khôi phục |
| `EXPORT` | ✅ Sau khi export dữ liệu |
| `IMPORT` | ✅ Sau khi import dữ liệu |
| GET (read only) | ❌ Không ghi |

### Cách ghi audit log

```typescript
import { writeAuditLog, getClientIp } from '@middleware/audit-log.middleware';
import { AuditAction } from '@shared/constants/enums';

// Trong service – sau khi thao tác DB thành công
await writeAuditLog({
  userId: userId,               // ID user thực hiện
  action: AuditAction.UPDATE,  // Enum AuditAction
  entityType: 'ip_assets',     // Tên bảng
  entityId: asset.id,          // ID bản ghi bị tác động
  oldValue: before as unknown as Record<string, unknown>,  // Snapshot trước (cho UPDATE/DELETE)
  newValue: after as unknown as Record<string, unknown>,   // Snapshot sau (cho CREATE/UPDATE)
  ipAddress: ipAddress,        // Từ getClientIp(req) trong controller
  userAgent: req.headers['user-agent'], // Optional
});
```

### Cách lấy IP từ controller

```typescript
import { getClientIp } from '@middleware/audit-log.middleware';

// Trong controller, truyền xuống service
const asset = await service.create(req.body, req.user!.id, getClientIp(req));
```

### Quy tắc quan trọng

- `writeAuditLog()` có `try/catch` nội bộ – **lỗi audit log không được làm crash request**.
- Audit log là **append-only** – không bao giờ update hoặc delete bản ghi audit.
- Với `UPDATE`: lấy snapshot `before` trước khi gọi `repo.update()`, snapshot `after` từ kết quả trả về.

---

## 9. Entity & Database

### BaseEntity

Mọi entity SHTT đều phải kế thừa `BaseEntity`:

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@models/base.entity';

@Entity('ten_bang')
export class TenEntity extends BaseEntity {
  // Chỉ khai báo thêm các cột đặc thù
  @Column({ type: 'varchar', length: 255 })
  ten_truong: string;
}
```

`BaseEntity` cung cấp sẵn:

| Column | Kiểu | Ghi chú |
|--------|------|---------|
| `id` | UUID (PK, auto-generate) | `@PrimaryGeneratedColumn('uuid')` |
| `created_at` | `datetime` | Tự động set khi tạo |
| `updated_at` | `datetime` | Tự động update khi sửa |
| `deleted_at` | `datetime` nullable | Soft delete (`@DeleteDateColumn`) |
| `created_by` | `varchar(36)` nullable | UUID user tạo |
| `updated_by` | `varchar(36)` nullable | UUID user cập nhật cuối |

### Quy tắc khai báo Column

```typescript
// ✅ Luôn có comment giải thích
@Column({ type: 'varchar', length: 100, nullable: true, comment: 'Số đơn đăng ký' })
application_number?: string;

// ✅ Dùng ? (optional) cho nullable column
@Column({ type: 'date', nullable: true })
grant_date?: Date;

// ✅ Khai báo default value trong decorator nếu có
@Column({ type: 'varchar', length: 10, default: 'BN' })
province_code: string;

// ✅ ENUM phải chỉ rõ enum object
@Column({ type: 'enum', enum: AssetType })
asset_type: AssetType;

// ✅ JSON column dùng cho mảng hoặc object lỏng cấu trúc
@Column({ type: 'json', nullable: true, comment: 'Mảng mã Nice (1-45)' })
nice_classes?: number[];
```

### Soft Delete

- TypeORM's `@DeleteDateColumn` kết hợp với `softDelete()` tự động set `deleted_at`.
- Query Builder mặc định của TypeORM đã lọc bỏ record có `deleted_at IS NOT NULL`.
- Để query cả record đã xóa (cho Admin): dùng `withDeleted()` trong query builder.

```typescript
// Chỉ lấy record chưa xóa (mặc định)
this.repo.findOne({ where: { id } });

// Lấy cả record đã xóa mềm (chỉ Admin)
this.repo.findOne({ where: { id }, withDeleted: true });
```

### Quy tắc Migration

- Không sửa trực tiếp schema SQL production.
- Mọi thay đổi schema đều phải qua migration script: `npm run db:migrate`.
- Migration file đặt trong `src/migrations/`, đặt tên theo format: `YYYYMMDDHHMMSS_mo-ta-ngan.ts`.

---

## 10. Service Layer

### Nguyên tắc

- Service là nơi chứa **toàn bộ business logic**.
- Service không trực tiếp dùng `req`, `res` của Express.
- Service nhận data đã được validate từ controller (qua DTO).
- Service có thể gọi nhiều repository hoặc service khác.

### Pattern chuẩn

```typescript
export class IpAssetService {
  private repo = new IpAssetRepository();

  // Luôn throw AppError khi có lỗi nghiệp vụ
  async getById(id: string): Promise<IpAsset> {
    const asset = await this.repo.findById(id);
    if (!asset) {
      throw new AppError(ErrorCode.ASSET_NOT_FOUND, 404, 'Không tìm thấy đối tượng SHTT');
    }
    return asset;
  }

  // Truyền userId và ipAddress để ghi audit log
  async create(dto: CreateIpAssetDto, userId: string, ipAddress?: string): Promise<IpAsset> {
    // 1. Business validation (ngoài class-validator)
    if (dto.application_number) {
      const existing = await this.repo.findByApplicationNumber(dto.application_number);
      if (existing) {
        throw new AppError(ErrorCode.ASSET_NUMBER_EXISTS, 409, 'Số đơn đã tồn tại');
      }
    }

    // 2. Thao tác DB
    const asset = await this.repo.create({ ...dto, created_by: userId });

    // 3. Ghi audit log
    await writeAuditLog({
      userId,
      action: AuditAction.CREATE,
      entityType: 'ip_assets',
      entityId: asset.id,
      newValue: asset as unknown as Record<string, unknown>,
      ipAddress,
    });

    return asset;
  }
}
```

### Convert kiểu dữ liệu

Date string từ DTO phải được convert sang `Date` object trước khi lưu DB:

```typescript
// Helper function – khai báo đầu file service
function toDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

// Dùng khi map DTO → entity
application_date: toDate(dto.application_date),
grant_date: toDate(dto.grant_date),
```

---

## 11. Repository Layer

### Nguyên tắc

- Repository chỉ chứa logic truy vấn DB – không có business logic.
- Dùng TypeORM `Repository` hoặc `QueryBuilder` – không viết raw SQL trừ khi cần tối ưu đặc biệt.
- Mọi query đều phải xem xét index đã khai báo trong schema.

### Pattern chuẩn

```typescript
export class IpAssetRepository {
  private repo: Repository<IpAsset>;

  constructor() {
    this.repo = AppDataSource.getRepository(IpAsset);
  }

  // Find by PK – trả null nếu không có
  async findById(id: string): Promise<IpAsset | null> {
    return this.repo.findOne({ where: { id } });
  }

  // Tìm kiếm + phân trang – trả tuple [items, total]
  async findMany(query: QueryIpAssetDto, page: number, limit: number): Promise<[IpAsset[], number]> {
    const qb = this.buildQueryBuilder(query);
    qb.orderBy(`asset.${query.sort_by ?? 'created_at'}`, query.sort_order ?? 'DESC');
    qb.skip((page - 1) * limit).take(limit);
    return qb.getManyAndCount();
  }

  // Create – nhận Partial<Entity>
  async create(data: Partial<IpAsset>): Promise<IpAsset> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  // Update – trả entity sau khi update (hoặc null)
  async update(id: string, data: Partial<IpAsset>): Promise<IpAsset | null> {
    await this.repo.update(id, data as QueryDeepPartialEntity<IpAsset>);
    return this.findById(id);
  }

  // Soft delete
  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.repo.update(id, { updated_by: deletedBy });
    await this.repo.softDelete(id);
  }

  // Hard delete
  async hardDelete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  // Restore
  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }

  // Query builder riêng – private, chỉ dùng trong repository
  private buildQueryBuilder(query: QueryIpAssetDto): SelectQueryBuilder<IpAsset> {
    const qb = this.repo.createQueryBuilder('asset');
    // Các điều kiện where...
    return qb;
  }
}
```

### Quy tắc Query Builder

```typescript
// ✅ Dùng named parameter để tránh SQL injection
qb.andWhere('asset.title LIKE :title', { title: `%${query.q}%` });

// ❌ Không bao giờ nối chuỗi trực tiếp vào query
qb.andWhere(`asset.title LIKE '%${query.q}%'`); // SQL Injection!

// ✅ Kiểm tra điều kiện trước khi thêm where
if (query.status) {
  qb.andWhere('asset.status = :status', { status: query.status });
}

// ✅ Dùng IN cho mảng
if (query.asset_type) {
  const types = Array.isArray(query.asset_type) ? query.asset_type : [query.asset_type];
  qb.andWhere('asset.asset_type IN (:...types)', { types });
}
```

---

## 12. Controller Layer

### Nguyên tắc

- Controller chỉ làm 3 việc: nhận input → gọi service → trả response.
- Không có business logic trong controller.
- Mọi method đều phải có `try/catch` và gọi `next(err)`.

### Pattern chuẩn

```typescript
export const IpAssetController = {
  /**
   * GET /ip-assets
   * Tất cả query params đã được validate bởi validateQuery middleware
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = parsePagination(req.query);
      const result = await service.list(req.query as QueryIpAssetDto, page, limit);
      sendSuccess(res, result.items, 200, result.meta);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /ip-assets
   * req.body đã được validate bởi validateBody middleware
   * req.user luôn tồn tại vì đã qua requireAuth
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const asset = await service.create(req.body, req.user!.id, getClientIp(req));
      sendCreated(res, asset);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /ip-assets/:id
   * 204 No Content – không trả body
   */
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.softDelete(req.params.id, req.user!.id, getClientIp(req));
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  },
};
```

---

## 13. Route Layer

### Nguyên tắc

- Route chỉ khai báo middleware chain và gán controller handler.
- Thứ tự middleware trong một route: `rateLimit` → `authenticateJWT` → `requireAuth` → `authorizeRoles()` → `validateBody/Query` → `controller`.
- Mount tất cả route vào `v1Router` trong `src/routes/index.ts`.

### Pattern chuẩn cho một feature

```typescript
// src/modules/ip-assets/routes/ip-asset.routes.ts
import { Router } from 'express';
import { guestRateLimit, authRateLimit } from '@middleware/rate-limit.middleware';
import { authenticateJWT, requireAuth, authorizeRoles } from '@middleware/auth.middleware';
import { validateBody, validateQuery } from '@middleware/validate.middleware';
import { UserRole } from '@shared/constants/enums';
import { IpAssetController } from '../controllers/ip-asset.controller';
import { CreateIpAssetDto, UpdateIpAssetDto } from '../dto/create-ip-asset.dto';
import { QueryIpAssetDto } from '../dto/query-ip-asset.dto';

const router = Router();

// Public routes
router.get('/', guestRateLimit, authenticateJWT, validateQuery(QueryIpAssetDto), IpAssetController.list);
router.get('/:id', guestRateLimit, IpAssetController.getById);

// Staff + Admin routes
router.post('/',
  authRateLimit, requireAuth,
  authorizeRoles(UserRole.STAFF, UserRole.ADMIN),
  validateBody(CreateIpAssetDto),
  IpAssetController.create
);
router.patch('/:id',
  authRateLimit, requireAuth,
  authorizeRoles(UserRole.STAFF, UserRole.ADMIN),
  validateBody(UpdateIpAssetDto),
  IpAssetController.update
);
router.delete('/:id',
  authRateLimit, requireAuth,
  authorizeRoles(UserRole.STAFF, UserRole.ADMIN),
  IpAssetController.remove
);

// Admin-only routes
router.delete('/:id/hard',
  authRateLimit, requireAuth,
  authorizeRoles(UserRole.ADMIN),
  IpAssetController.hardDelete
);
router.post('/:id/restore',
  authRateLimit, requireAuth,
  authorizeRoles(UserRole.ADMIN),
  IpAssetController.restore
);

export { router as ipAssetRouter };
```

```typescript
// src/routes/index.ts – mount tất cả
import { Router } from 'express';
import { ipAssetRouter } from '@modules/ip-assets/routes/ip-asset.routes';
// ... import các router khác

export const v1Router = Router();

v1Router.get('/health', ...);
v1Router.use('/ip-assets', ipAssetRouter);
v1Router.use('/users', userRouter);
// ...
```

---

## 14. Phân trang (Pagination)

### Helper có sẵn

```typescript
import { parsePagination, buildPaginationMeta } from '@shared/helpers/pagination.helper';

// Trong controller
const { page, limit } = parsePagination(req.query);
// page: min=1, default=1
// limit: min=1, max=100, default=20

// Trong service – sau khi có kết quả từ repo
const [items, total] = await this.repo.findMany(query, page, limit);
return {
  items,
  meta: buildPaginationMeta(total, page, limit),
  // { page, limit, total, totalPages }
};
```

### Quy tắc

- Tất cả API trả danh sách đều phải có phân trang.
- Không trả toàn bộ data không giới hạn.
- `limit` tối đa là **100** – enforce ở `parsePagination()`.
- Export hàng loạt: tối đa **5000** bản ghi/lần (ném 422 nếu vượt).

---

## 15. Upload File

### Quy tắc validate file

| Loại file | MIME type hợp lệ | Max size |
|-----------|-----------------|---------|
| Hình ảnh (logo, gallery) | `image/jpeg`, `image/png`, `image/webp` | **5 MB** |
| Tài liệu (bản mô tả, toàn văn) | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | **20 MB** |
| Import Excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | **50 MB** |

### Quy tắc bảo mật upload

1. Kiểm tra **MIME type** qua header (Content-Type).
2. Kiểm tra **magic bytes** (4 byte đầu của file) – không tin tưởng extension hoặc MIME do client khai báo.
3. Đặt tên file theo format: `<uuid>.<ext>` – không dùng tên file gốc của user.
4. Lưu vào **MinIO** (không lưu trực tiếp vào filesystem server).
5. URL trả về phải là URL đầy đủ của MinIO/CDN, không phải local path.

```typescript
// Cấu hình multer – đặt trong config/upload.config.ts
const upload = multer({
  limits: { fileSize: env.upload.maxSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = env.upload.allowedTypes; // ['jpg','jpeg','png','pdf','docx']
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      return cb(new AppError(ErrorCode.UPLOAD_FILE_TYPE_INVALID, 400, 'Loại file không được phép'));
    }
    cb(null, true);
  },
});
```

---

## 16. Biến môi trường (Env Config)

### Quy tắc

- Không bao giờ hardcode giá trị config (DB password, JWT key, ...) trong code.
- Tất cả config đọc qua `env` object từ `src/config/env.config.ts`.
- Dùng `required()` cho biến bắt buộc (app sẽ crash nếu thiếu).
- Dùng `optional(key, defaultValue)` cho biến có giá trị mặc định.

```typescript
import { env } from '@config/env.config';

// ✅ Đúng
const port = env.server.port;
const jwtKey = env.jwt.privateKey;

// ❌ Sai
const port = process.env.PORT || 3000; // Bypass validation
const jwtKey = 'hardcoded-secret';     // Security risk
```

### Các biến môi trường bắt buộc (production)

| Biến | Mô tả |
|------|-------|
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_NAME` | Tên database |
| `DB_USER` | MySQL user |
| `DB_PASS` | MySQL password |
| `JWT_PRIVATE_KEY` | Base64-encoded RSA private key |
| `JWT_PUBLIC_KEY` | Base64-encoded RSA public key |
| `MINIO_ENDPOINT` | MinIO server URL |
| `MINIO_ACCESS_KEY` | MinIO access key |
| `MINIO_SECRET_KEY` | MinIO secret key |

---

## 17. Logging

### Logger có sẵn (`src/infrastructure/logger/logger.ts`)

```typescript
import { logger } from '@infrastructure/logger/logger';

// Các level
logger.info('User logged in', { context: 'AuthService', userId: user.id });
logger.warn('Account locked', { context: 'AuthService', userId: user.id, attempts: 5 });
logger.error('Failed to save', { context: 'IpAssetService', error: err.message, stack: err.stack });
logger.debug('Query executed', { context: 'IpAssetRepository', sql: '...' }); // Chỉ ở dev
```

### Quy tắc

- Luôn kèm `context` (tên class/function) để dễ trace.
- **Không log thông tin nhạy cảm:** password, JWT token, CMND, số điện thoại.
- Log `info` cho các sự kiện nghiệp vụ quan trọng (login, create, delete).
- Log `error` cho mọi lỗi 500 – luôn kèm `stack`.
- Log level trong production: `info` trở lên (không log `debug`).
- Log được ghi ra file theo ngày – lưu tối thiểu **12 tháng**.

### Không log những gì

```typescript
// ❌ Không log password
logger.info('Login attempt', { identifier, password }); // NGUY HIỂM

// ❌ Không log JWT token
logger.info('Token generated', { access_token }); // NGUY HIỂM

// ✅ Đúng – chỉ log thông tin không nhạy cảm
logger.info('User logged in', { userId: user.id, ip: ipAddress });
```

---

## 18. Bảo mật

### Headers bảo mật

Dùng `helmet` (đã tích hợp sẵn trong Express app):

```typescript
app.use(helmet()); // Tự động set các header: CSP, HSTS, X-Frame-Options, ...
```

### CORS

```typescript
app.use(cors({
  origin: env.server.corsOrigins, // Whitelist từ env, không dùng '*' ở production
  credentials: true,
}));
```

### Quy tắc bảo mật code

| Hạng mục | Quy tắc |
|----------|---------|
| **SQL Injection** | Luôn dùng named parameter trong TypeORM; không nối chuỗi vào query |
| **XSS** | Sanitize HTML output nếu có; Content-Type response phải là `application/json` |
| **Password** | Bcrypt với cost ≥ 12; không lưu plain text |
| **JWT** | Algorithm RS256; không dùng HS256; access token TTL 15 phút |
| **Refresh token** | Lưu hash trong DB; revoke khi logout; rotation sau mỗi lần dùng |
| **Upload** | Kiểm tra magic bytes; lưu MinIO không phải local path |
| **Rate limit** | Mọi endpoint đều có rate limit |
| **Input validation** | Dùng `whitelist: true` và `forbidNonWhitelisted: true` trong class-validator |
| **Sensitive data** | Ẩn CMND, SĐT, email cá nhân ở response public (Guest) |

### Ẩn thông tin nhạy cảm với Guest

```typescript
// Trong service – transform response trước khi trả về
function sanitizeForPublic(asset: IpAsset): Partial<IpAsset> {
  const { internal_notes, ...publicFields } = asset;
  // internal_notes chỉ cho Staff/Admin
  return publicFields;
}
```

---

## 19. Checklist tạo API mới

Khi thêm một endpoint mới, dev phải hoàn thành **toàn bộ** checklist sau trước khi tạo PR:

### Cấu trúc code

- [ ] Tạo DTO class với đầy đủ decorator `class-validator` (body và/hoặc query)
- [ ] Khai báo method trong Controller với đúng pattern (try/catch, next(err))
- [ ] Tạo method tương ứng trong Service (business logic, throw AppError)
- [ ] Tạo method tương ứng trong Repository nếu cần query mới
- [ ] Đăng ký route với đúng thứ tự middleware

### Middleware chain

- [ ] Rate limit được đặt đúng loại (`guestRateLimit` hoặc `authRateLimit` hoặc `loginRateLimit`)
- [ ] `authenticateJWT` được đặt cho public route cần đọc user info (optional auth)
- [ ] `requireAuth` được đặt cho mọi route cần đăng nhập
- [ ] `authorizeRoles(...)` được đặt đúng với vai trò được phép
- [ ] `validateBody` hoặc `validateQuery` được đặt trước controller handler

### Logic nghiệp vụ

- [ ] Kiểm tra resource tồn tại trước khi thao tác (ném 404 nếu không có)
- [ ] Kiểm tra unique constraint trước khi tạo (ném 409 nếu trùng)
- [ ] Validate ngày tháng logic (ví dụ: grant_date ≥ publication_date)
- [ ] Soft delete: bản ghi đã xóa không hiển thị với Guest

### Response

- [ ] Dùng đúng helper: `sendSuccess` / `sendCreated` / `sendNoContent`
- [ ] List API trả kèm `meta` pagination
- [ ] Không trả `internal_notes` cho Guest

### Audit Log

- [ ] Ghi audit log cho mọi thao tác ghi (CREATE/UPDATE/DELETE/RESTORE/EXPORT/IMPORT)
- [ ] UPDATE log có cả `oldValue` và `newValue`
- [ ] DELETE log có `oldValue`

### Bảo mật & Hiệu năng

- [ ] Không hardcode giá trị config
- [ ] Không log thông tin nhạy cảm
- [ ] Không nối chuỗi vào SQL query
- [ ] Có index phù hợp cho trường được dùng trong WHERE/ORDER BY

### Test

- [ ] Viết unit test cho Service (mock Repository)
- [ ] Viết integration test (supertest) cho endpoint mới
- [ ] Test đủ 3 role: Guest, Staff, Admin
- [ ] Test các trường hợp lỗi chính (400, 401, 403, 404, 409)

---

## Phụ lục – Enum & Error Code tham chiếu nhanh

### Enum (`src/shared/constants/enums.ts`)

```typescript
AssetType:    copyright | gi | trademark | patent | design | craft
AssetStatus:  pending | published | granted | refused | withdrawn | expired | lapsed
UserRole:     admin | staff
AuditAction:  CREATE | UPDATE | SOFT_DELETE | HARD_DELETE | RESTORE | LOGIN | LOGOUT | EXPORT | IMPORT
SortOrder:    ASC | DESC
TrademarkApplicationType: individual | collective | certification
CopyrightWorkType: literary | musical | dramatic | artistic | cinematographic | software | other
PatentType:   invention | utility
```

### Error Code nhanh (`src/shared/constants/error-codes.ts`)

```typescript
// Auth
AUTH_INVALID_CREDENTIALS  → 401
AUTH_TOKEN_EXPIRED         → 401
AUTH_TOKEN_INVALID         → 401
AUTH_REFRESH_TOKEN_INVALID → 401
AUTH_ACCOUNT_LOCKED        → 401
AUTH_ACCOUNT_INACTIVE      → 401

// RBAC
UNAUTHORIZED → 401
FORBIDDEN    → 403

// Resource
NOT_FOUND        → 404
ASSET_NOT_FOUND  → 404
USER_NOT_FOUND   → 404

// Conflict
CONFLICT              → 409
ASSET_NUMBER_EXISTS   → 409
USER_EMAIL_EXISTS     → 409
USER_USERNAME_EXISTS  → 409

// Validation
VALIDATION_ERROR      → 400 (format/type sai)
UNPROCESSABLE_ENTITY  → 422 (logic nghiệp vụ sai)

// File
UPLOAD_FILE_TOO_LARGE   → 400
UPLOAD_FILE_TYPE_INVALID → 400

// System
TOO_MANY_REQUESTS    → 429
INTERNAL_SERVER_ERROR → 500
```

---

*Tài liệu Quy tắc BE v1.0 – Hệ thống CSDL SHTT tỉnh Bắc Ninh*  
*Cập nhật: 22/04/2026*
