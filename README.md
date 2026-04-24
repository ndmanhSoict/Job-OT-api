# LCMS-API

> **Hệ thống Cơ sở Dữ liệu Tài sản Sở hữu Trí tuệ tỉnh Bắc Ninh**  
> Node.js · Express · TypeScript · TypeORM · MySQL 8.0

---

## Yêu cầu hệ thống

| Công nghệ | Phiên bản tối thiểu |
|-----------|-------------------|
| Node.js | 20 LTS |
| npm | 10+ |
| MySQL | 8.0+ |
| Docker | 24+ (tùy chọn) |

---

## Cài đặt nhanh

### 1. Clone & cài dependencies

```bash
git clone <repo-url>
cd LCMS-API
npm install
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
# Chỉnh sửa .env theo môi trường của bạn
```

### 3. Tạo JWT key pair (RS256)

```bash
npm run generate:keys
# Copy 2 dòng JWT_PRIVATE_KEY và JWT_PUBLIC_KEY vào .env
```

### 4. Khởi động DB bằng Docker

```bash
# Chỉ start MySQL + Redis (không start API container)
docker compose up -d mysql redis

# Hoặc start toàn bộ stack
docker compose --profile full up -d
```

### 5. Chạy migration & seed

```bash
npm run db:migrate   # Tạo schema
npm run db:seed      # Seed dữ liệu tham chiếu + tài khoản admin mặc định
```

> **Tài khoản admin mặc định sau khi seed:**  
> Username: `admin` | Password: `Admin@123456`  
> ⚠️ **Đổi mật khẩu ngay sau lần đăng nhập đầu tiên!**

### 6. Chạy server

```bash
npm run dev     # Development (hot reload)
npm run build   # Build TypeScript
npm start       # Production
```

---

## API Documentation

Sau khi chạy server ở môi trường development:

- **Swagger UI:** http://localhost:3000/api-docs
- **Health check:** http://localhost:3000/api/v1/health
- **OpenAPI spec:** `swagger.yaml` (root)

---

## Cấu trúc thư mục

```
src/
├── config/             # Env, JWT, DB, Swagger
├── infrastructure/
│   ├── database/       # TypeORM DataSource + migrations
│   └── logger/         # Winston
├── middleware/         # Auth (JWT/RBAC), rate-limit, error handler, audit
├── models/             # TypeORM entities
├── modules/            # Feature modules
│   ├── auth/           # Login, refresh, logout
│   ├── ip-assets/      # Base CRUD cho tất cả SHTT
│   ├── copyright/      # Stub → implement sau
│   ├── trademark/      # Stub → implement sau
│   ├── patent/         # Stub → implement sau
│   ├── design/         # Stub → implement sau
│   ├── gi/             # Stub → implement sau
│   ├── craft-village/  # Làng nghề
│   ├── users/          # Quản lý tài khoản (Admin)
│   ├── search/         # Tìm kiếm
│   └── dashboard/      # Thống kê
├── routes/             # Express routers (v1)
├── scripts/            # migrate, seed, rollback, generate-keys
├── shared/             # Constants, helpers, validators
├── tests/              # Jest unit tests
├── types/              # TypeScript augmentations
├── app.ts              # Express app factory
└── server.ts           # HTTP server + graceful shutdown
```

---

## Commands

```bash
npm run dev           # Dev server (ts-node-dev, hot reload)
npm run build         # Compile TypeScript → dist/
npm start             # Production server
npm test              # Unit tests
npm run test:cov      # Tests + coverage report
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run db:migrate    # Chạy migrations
npm run db:seed       # Seed reference data
npm run db:rollback   # Rollback migration cuối
npm run generate:keys # Tạo RS256 key pair
```

---

## Phân quyền

| Endpoint | Guest | Staff | Admin |
|----------|:-----:|:-----:|:-----:|
| `GET /ip-assets` | ✅ | ✅ | ✅ |
| `GET /ip-assets/:id` | ✅ | ✅ | ✅ |
| `POST /ip-assets` | ❌ | ✅ | ✅ |
| `PATCH /ip-assets/:id` | ❌ | ✅ | ✅ |
| `DELETE /ip-assets/:id` | ❌ | ✅ (soft) | ✅ |
| `DELETE /ip-assets/:id/hard` | ❌ | ❌ | ✅ |
| `POST /ip-assets/:id/restore` | ❌ | ❌ | ✅ |
| `GET /search` | ✅ | ✅ | ✅ |
| `GET /dashboard/*` | ❌ | ✅ | ✅ |
| `GET /users` | ❌ | ❌ | ✅ |
| `POST /users` | ❌ | ❌ | ✅ |

---

## Môi trường

| Biến | Bắt buộc | Mô tả |
|------|:--------:|-------|
| `DB_HOST` | ✅ | MySQL host |
| `DB_NAME` | ✅ | Tên database |
| `DB_USER` | ✅ | MySQL user |
| `DB_PASS` | ✅ | MySQL password |
| `JWT_PRIVATE_KEY` | ✅ | RS256 private key (base64) |
| `JWT_PUBLIC_KEY` | ✅ | RS256 public key (base64) |
| `NODE_ENV` | — | development \| production |
| `PORT` | — | Default: 3000 |

Xem đầy đủ trong `.env.example`.

---

## Roadmap

### Phase 1 (MVP – hiện tại)
- [x] Codebase skeleton + config
- [x] Auth (JWT RS256 + refresh token rotation)
- [x] RBAC (Admin/Staff/Guest)
- [x] Base CRUD cho `ip_assets`
- [x] Soft delete + audit log
- [x] Rate limiting
- [x] Swagger docs
- [ ] Implement module detail (copyright, trademark, patent, design, gi)
- [ ] User management (Admin CRUD)
- [ ] File upload (local disk)

### Phase 2
- [ ] Elasticsearch integration (Vietnamese analyzer)
- [ ] Redis cache
- [ ] MinIO object storage
- [ ] Import từ Excel/CSV
- [ ] Export PDF/Excel
- [ ] WIPO ST.86 XML import/export
- [ ] GIS integration (OpenStreetMap)
- [ ] 2FA cho Admin (TOTP)

---

## Tham chiếu tài liệu

- `CLAUDE.md` – Hướng dẫn cho Claude Code (đọc trước khi code)
- `swagger.yaml` – OpenAPI 3.0 specification
- `docker-compose.yml` – Dev environment
- `src/infrastructure/database/` – Migrations
