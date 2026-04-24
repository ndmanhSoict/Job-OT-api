# API SPECIFICATION – HỆ THỐNG CSDL SỞ HỮU TRÍ TUỆ TỈNH BẮC NINH

> **Phiên bản:** 1.0  
> **Base URL:** `https://api.shtt.bacninh.gov.vn/api/v1`  
> **Auth scheme:** Bearer JWT (RS256) – Access token TTL 15 phút / Refresh token TTL 7 ngày  
> **Content-Type:** `application/json` (trừ upload file dùng `multipart/form-data`)

---

## MỤC LỤC

1. [Quy ước chung](#1-quy-ước-chung)
2. [Phân quyền tác nhân](#2-phân-quyền-tác-nhân)
3. [Định dạng lỗi chuẩn](#3-định-dạng-lỗi-chuẩn)
4. [AUTH – Xác thực](#4-auth--xác-thực)
5. [IP ASSETS – Đối tượng SHTT (Base CRUD)](#5-ip-assets--đối-tượng-shtt-base-crud)
6. [SEARCH – Tìm kiếm toàn văn](#6-search--tìm-kiếm-toàn-văn)
7. [USERS – Quản lý tài khoản](#7-users--quản-lý-tài-khoản)
8. [CRAFT VILLAGES – Làng nghề](#8-craft-villages--làng-nghề)
9. [DASHBOARD – Thống kê & Cảnh báo](#9-dashboard--thống-kê--cảnh-báo)
10. [REFERENCE DATA – Dữ liệu tra cứu](#10-reference-data--dữ-liệu-tra-cứu)
11. [UPLOAD – Hình ảnh & File đính kèm](#11-upload--hình-ảnh--file-đính-kèm)
12. [EXPORT / IMPORT – Xuất nhập hàng loạt](#12-export--import--xuất-nhập-hàng-loạt)
13. [Bảng tóm tắt tất cả API](#13-bảng-tóm-tắt-tất-cả-api)

---

## 1. Quy ước chung

### Response thành công

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

- `meta` chỉ có ở các API trả về danh sách (list/paginated).

### Enum chung

| Enum | Giá trị |
|------|---------|
| `AssetType` | `copyright` \| `gi` \| `trademark` \| `patent` \| `design` \| `craft` |
| `AssetStatus` | `draft` \| `pending_formal` \| `published` \| `pending_substantive` \| `granted` \| `refused` \| `withdrawn` \| `lapsed` |
| `UserRole` | `admin` \| `staff` |
| `SortOrder` | `ASC` \| `DESC` |
| `TrademarkApplicationType` | `individual` \| `collective` \| `certification` |
| `CopyrightWorkType` | `literary` \| `musical` \| `dramatic` \| `artistic` \| `cinematographic` \| `software` \| `other` |
| `PatentType` | `invention` \| `utility` |

### Rate Limit

| Tác nhân | Giới hạn |
|----------|---------|
| Guest (không token) | 60 req/phút/IP |
| Staff / Admin | 300 req/phút/IP |

---

## 2. Phân quyền tác nhân

| Tác nhân | Xác thực | Mô tả |
|----------|----------|-------|
| **Guest** | Không cần token | Chỉ đọc dữ liệu công khai, tìm kiếm, xem chi tiết. Bị ẩn: `internal_notes`, CMND, SĐT, email cá nhân |
| **Staff** | Bearer JWT (role = `staff`) | CRUD tất cả đối tượng SHTT; soft-delete; import Excel; xem audit log của mình |
| **Admin** | Bearer JWT (role = `admin`) | Toàn quyền Staff + hard-delete, restore, quản lý tài khoản, xem tất cả audit log, export |

---

## 3. Định dạng lỗi chuẩn

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

### Bảng mã lỗi hệ thống

| HTTP | Code | Mô tả |
|------|------|-------|
| 400 | `VALIDATION_ERROR` | Input không hợp lệ (body/query params) |
| 401 | `UNAUTHORIZED` | Chưa đăng nhập hoặc thiếu token |
| 401 | `AUTH_TOKEN_EXPIRED` | Access token hết hạn |
| 401 | `AUTH_TOKEN_INVALID` | Token sai hoặc bị giả mạo |
| 401 | `AUTH_REFRESH_TOKEN_INVALID` | Refresh token không hợp lệ hoặc đã bị thu hồi |
| 401 | `AUTH_INVALID_CREDENTIALS` | Sai username/password |
| 401 | `AUTH_ACCOUNT_LOCKED` | Tài khoản bị khóa tạm thời (15 phút) |
| 401 | `AUTH_ACCOUNT_INACTIVE` | Tài khoản bị vô hiệu hóa |
| 403 | `FORBIDDEN` | Không đủ quyền (sai role) |
| 404 | `ASSET_NOT_FOUND` | Không tìm thấy đối tượng SHTT |
| 404 | `USER_NOT_FOUND` | Không tìm thấy tài khoản |
| 404 | `NOT_FOUND` | Resource không tồn tại |
| 409 | `ASSET_NUMBER_EXISTS` | Số đơn đã tồn tại |
| 409 | `USER_EMAIL_EXISTS` | Email đã được dùng |
| 409 | `USER_USERNAME_EXISTS` | Username đã được dùng |
| 422 | `UNPROCESSABLE_ENTITY` | Dữ liệu hợp lệ về format nhưng vi phạm rule nghiệp vụ |
| 429 | `TOO_MANY_REQUESTS` | Vượt rate limit |
| 500 | `INTERNAL_SERVER_ERROR` | Lỗi nội bộ server |

---

## 4. AUTH – Xác thực

### 4.1 Đăng nhập

**`POST /auth/login`**

| | |
|---|---|
| **Tác nhân** | Tất cả (Staff, Admin) |
| **Quyền** | Không cần token |

#### Request Body

```json
{
  "identifier": "admin",
  "password": "Admin@123456"
}
```

| Trường | Kiểu | Bắt buộc | Validate |
|--------|------|:--------:|---------|
| `identifier` | string | ✅ | Username hoặc email; không rỗng; max 255 ký tự |
| `password` | string | ✅ | Không rỗng; min 8 ký tự |

#### Response 200

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiJ9...",
    "refresh_token": "eyJhbGciOiJSUzI1NiJ9...",
    "expires_in": 900
  }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Username/email không tồn tại | 401 | `AUTH_INVALID_CREDENTIALS` |
| Sai password | 401 | `AUTH_INVALID_CREDENTIALS` |
| Tài khoản inactive | 401 | `AUTH_ACCOUNT_INACTIVE` |
| Sai password ≥ 5 lần → khóa 15 phút | 401 | `AUTH_ACCOUNT_LOCKED` |
| Vượt rate limit | 429 | `TOO_MANY_REQUESTS` |

---

### 4.2 Làm mới Access Token

**`POST /auth/refresh`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin (đang có refresh token hợp lệ) |
| **Quyền** | Không cần access token |

#### Request Body

```json
{
  "refresh_token": "eyJhbGciOiJSUzI1NiJ9..."
}
```

| Trường | Kiểu | Bắt buộc | Validate |
|--------|------|:--------:|---------|
| `refresh_token` | string | ✅ | Không rỗng |

#### Response 200

```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_in": 900
  }
}
```

> **Lưu ý:** Token rotation – refresh token cũ bị revoke, cấp pair mới.

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Token không hợp lệ / signature sai | 401 | `AUTH_REFRESH_TOKEN_INVALID` |
| Token đã bị revoke hoặc hết hạn | 401 | `AUTH_REFRESH_TOKEN_INVALID` |
| Tài khoản bị vô hiệu hóa | 401 | `AUTH_ACCOUNT_INACTIVE` |

---

### 4.3 Đăng xuất

**`POST /auth/logout`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT (bất kỳ role) |

#### Headers

```
Authorization: Bearer <access_token>
```

#### Request Body

```json
{
  "refresh_token": "eyJhbGciOiJSUzI1NiJ9..."
}
```

#### Response 200

```json
{
  "success": true,
  "data": { "message": "Đăng xuất thành công" }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Không có access token | 401 | `UNAUTHORIZED` |
| Access token hết hạn | 401 | `AUTH_TOKEN_EXPIRED` |

---

### 4.4 Xem thông tin bản thân

**`GET /auth/me`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT (bất kỳ role) |

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "email": "admin@shtt.bacninh.gov.vn",
    "full_name": "Nguyễn Văn A",
    "role": "admin",
    "is_active": true,
    "last_login_at": "2026-04-22T08:30:00.000Z"
  }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Không có token | 401 | `UNAUTHORIZED` |
| Token hết hạn | 401 | `AUTH_TOKEN_EXPIRED` |

---

## 5. IP ASSETS – Đối tượng SHTT (Base CRUD)

> Áp dụng cho cả 5 loại đối tượng SHTT chính: `copyright`, `gi`, `trademark`, `patent`, `design`.  
> Module `craft` (làng nghề) có endpoint riêng tại mục 8.

### 5.1 Lấy danh sách đối tượng SHTT

**`GET /ip-assets`**

| | |
|---|---|
| **Tác nhân** | Guest, Staff, Admin |
| **Quyền** | Công khai – không cần token |

> **Lưu ý phân quyền hiển thị:** Guest không nhìn thấy `internal_notes`; thông tin cá nhân nhạy cảm (CMND, SĐT, email) được ẩn ở tầng ứng dụng.

#### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả | Validate |
|---------|------|:--------:|-------|---------|
| `page` | integer | ❌ | Trang hiện tại | min=1, default=1 |
| `limit` | integer | ❌ | Số bản ghi/trang | min=1, max=100, default=20 |
| `asset_type` | string/array | ❌ | Lọc theo loại | Enum `AssetType`; nhiều giá trị: `?asset_type=trademark&asset_type=patent` |
| `status` | string | ❌ | Lọc theo trạng thái | Enum `AssetStatus` |
| `q` | string | ❌ | Tìm kiếm toàn văn | Tìm trong: title, application_number, grant_number, applicant_name; min 1 ký tự |
| `application_number` | string | ❌ | Tìm chính xác theo số đơn | |
| `grant_number` | string | ❌ | Tìm chính xác theo số bằng | |
| `applicant_name` | string | ❌ | Tìm gần đúng theo tên chủ đơn | LIKE search |
| `province_code` | string | ❌ | Lọc theo tỉnh | max 10 ký tự, default 'BN' |
| `district_code` | string | ❌ | Lọc theo huyện (đặc thù Bắc Ninh) | max 10 ký tự |
| `application_date_from` | date | ❌ | Ngày nộp đơn từ | ISO 8601: YYYY-MM-DD |
| `application_date_to` | date | ❌ | Ngày nộp đơn đến | ISO 8601: YYYY-MM-DD |
| `grant_date_from` | date | ❌ | Ngày cấp bằng từ | ISO 8601: YYYY-MM-DD |
| `grant_date_to` | date | ❌ | Ngày cấp bằng đến | ISO 8601: YYYY-MM-DD |
| `expiry_date_from` | date | ❌ | Ngày hết hạn từ | ISO 8601: YYYY-MM-DD |
| `expiry_date_to` | date | ❌ | Ngày hết hạn đến | ISO 8601: YYYY-MM-DD |
| `sort_by` | string | ❌ | Trường sắp xếp | Enum: `title` \| `application_date` \| `grant_date` \| `expiry_date` \| `created_at` |
| `sort_order` | string | ❌ | Chiều sắp xếp | `ASC` \| `DESC`, default=`DESC` |

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "asset_type": "trademark",
      "title": "Nhãn hiệu DALAT MILK",
      "application_number": "4-2024-12345",
      "application_date": "2024-01-15",
      "publication_number": "46-2024-00123",
      "publication_date": "2024-06-01",
      "grant_number": "345678",
      "grant_date": "2025-01-15",
      "expiry_date": "2034-01-15",
      "status": "granted",
      "applicant_name": "Công ty TNHH ABC",
      "province_code": "BN",
      "district_code": "BN.TT",
      "created_at": "2024-01-20T08:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Query param không hợp lệ (vd: `asset_type=invalid`) | 400 | `VALIDATION_ERROR` |
| `application_date_from` > `application_date_to` | 400 | `VALIDATION_ERROR` |
| Vượt rate limit (Guest 60 req/phút) | 429 | `TOO_MANY_REQUESTS` |

---

### 5.2 Xem chi tiết một đối tượng SHTT

**`GET /ip-assets/:id`**

| | |
|---|---|
| **Tác nhân** | Guest, Staff, Admin |
| **Quyền** | Công khai – không cần token |

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | UUID | ID của đối tượng SHTT |

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "asset_type": "trademark",
    "title": "Nhãn hiệu DALAT MILK",
    "application_number": "4-2024-12345",
    "application_date": "2024-01-15",
    "publication_number": "46-2024-00123",
    "publication_date": "2024-06-01",
    "grant_number": "345678",
    "grant_date": "2025-01-15",
    "expiry_date": "2034-01-15",
    "status": "granted",
    "applicant_name": "Công ty TNHH ABC",
    "applicant_org_id": "org-uuid-here",
    "province_code": "BN",
    "district_code": "BN.TT",
    "meta": {
      "application_type": "individual",
      "logo_image_url": "https://minio.shtt.bacninh.gov.vn/...",
      "nice_classes": [29, 30],
      "vienna_codes": ["27.05.01"]
    },
    "created_at": "2024-01-20T08:00:00.000Z",
    "updated_at": "2025-01-15T10:00:00.000Z"
  }
}
```

> **Lưu ý:** `internal_notes` chỉ trả về khi người gọi là Staff hoặc Admin.

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| ID không tồn tại | 404 | `ASSET_NOT_FOUND` |
| ID đã bị soft-delete (Guest) | 404 | `ASSET_NOT_FOUND` |
| Format UUID sai | 400 | `VALIDATION_ERROR` |

---

### 5.3 Tạo mới đối tượng SHTT

**`POST /ip-assets`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT – role `staff` hoặc `admin` |

#### Request Body

```json
{
  "asset_type": "trademark",
  "title": "Nhãn hiệu XYZ",
  "application_number": "4-2025-99999",
  "application_date": "2025-03-01",
  "publication_number": "46-2025-00456",
  "publication_date": "2025-09-01",
  "grant_number": null,
  "grant_date": null,
  "expiry_date": null,
  "status": "published",
  "applicant_org_id": "org-uuid-here",
  "applicant_person_id": null,
  "applicant_name": "Công ty TNHH XYZ",
  "province_code": "BN",
  "district_code": "BN.TL",
  "internal_notes": "Hồ sơ nhận ngày 01/03/2025",
  "meta": {
    "application_type": "individual",
    "nice_classes": [25, 35],
    "vienna_codes": ["26.04.01"],
    "logo_image_url": "https://minio.../logo.jpg",
    "is_colored": false,
    "goods_services_description": "Quần áo, giày dép..."
  }
}
```

#### Validate chi tiết theo `asset_type`

**Chung (tất cả loại):**

| Trường | Bắt buộc | Validate |
|--------|:--------:|---------|
| `asset_type` | ✅ | Enum `AssetType` |
| `title` | ✅ | Không rỗng; max 500 ký tự |
| `application_number` | ❌ | max 100 ký tự; **UNIQUE trong DB** (409 nếu trùng) |
| `application_date` | ❌ | ISO 8601 date; không được là ngày tương lai |
| `publication_number` | ❌ | max 100 ký tự |
| `publication_date` | ❌ | ISO 8601 date; phải ≥ `application_date` nếu cả hai có mặt |
| `grant_number` | ❌ | max 100 ký tự |
| `grant_date` | ❌ | ISO 8601 date; phải ≥ `publication_date` nếu có |
| `expiry_date` | ❌ | ISO 8601 date; phải > `grant_date` nếu có |
| `status` | ❌ | Enum `AssetStatus`; default = `pending_formal` |
| `applicant_org_id` | ❌ | UUID hợp lệ; FK → organizations |
| `applicant_person_id` | ❌ | UUID hợp lệ; FK → persons |
| `applicant_name` | ❌ | max 500 ký tự; nên có ít nhất `applicant_name` hoặc `applicant_org_id/person_id` |
| `province_code` | ❌ | max 10 ký tự; default = `BN` |
| `district_code` | ❌ | max 10 ký tự; FK → ref_districts nếu không null |
| `internal_notes` | ❌ | Text tự do |
| `meta` | ❌ | JSON object – validate chi tiết theo loại (xem bên dưới) |

**`meta` theo loại đối tượng:**

| `asset_type` | Trường meta quan trọng | Ghi chú |
|---|---|---|
| `copyright` | `work_type` (Enum CopyrightWorkType)✅; `authors` (string)✅; `author_address`; `owner_name`✅; `owner_address`; `certificate_number`; `certificate_date`; `work_sample_url` | `certificate_number` = Số GCN |
| `gi` | `product_name`✅; `geographical_area`✅; `managing_org`✅; `description_doc_url`; `quality_characteristics` | Chỉ dẫn địa lý |
| `trademark` | `application_type` (Enum)✅; `logo_image_url`; `vienna_codes` (array string); `nice_classes` (array int 1-45)✅; `goods_services_description`; `is_colored` (bool) | nice_classes phải trong [1..45] |
| `patent` | `patent_type` (Enum PatentType)✅; `inventors` (array string)✅; `ipc_codes` (array string); `abstract_text`; `claims`; `full_text_url` | |
| `design` | `creators` (array string)✅; `locarno_codes` (array string); `description`; `design_variants_count` (int); `renewal_count` (int, max=2) | Kiểu dáng công nghiệp |

#### Response 201

```json
{
  "success": true,
  "data": {
    "id": "new-uuid-here",
    "asset_type": "trademark",
    "title": "Nhãn hiệu XYZ",
    "status": "published",
    ...
  }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Không có access token | 401 | `UNAUTHORIZED` |
| Token hết hạn | 401 | `AUTH_TOKEN_EXPIRED` |
| Role = Guest (không có token) | 401 | `UNAUTHORIZED` |
| `asset_type` không hợp lệ | 400 | `VALIDATION_ERROR` |
| `title` rỗng hoặc thiếu | 400 | `VALIDATION_ERROR` |
| `application_date` sai format | 400 | `VALIDATION_ERROR` |
| Số đơn (`application_number`) đã tồn tại | 409 | `ASSET_NUMBER_EXISTS` |
| `district_code` không tồn tại trong ref_districts | 422 | `UNPROCESSABLE_ENTITY` |

---

### 5.4 Cập nhật đối tượng SHTT

**`PATCH /ip-assets/:id`**

| | |
|---|---|
| **Tác nhân** | Staff (bản ghi được gán hoặc của mình), Admin (tất cả) |
| **Quyền** | Bearer JWT – role `staff` hoặc `admin` |

#### Path Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `id` | UUID | ID bản ghi cần cập nhật |

#### Request Body

Tất cả trường đều **optional** (PATCH semantics). Chỉ gửi trường cần thay đổi:

```json
{
  "status": "granted",
  "grant_number": "345678",
  "grant_date": "2025-06-01",
  "expiry_date": "2035-06-01",
  "internal_notes": "Đã cấp bằng ngày 01/06/2025"
}
```

#### Validate

- Áp dụng quy tắc validate giống phần tạo mới, nhưng không bắt buộc trường nào.
- Không được thay đổi `asset_type` sau khi tạo.
- Không được thay đổi `application_number` thành số đã tồn tại của bản ghi khác.

#### Response 200

```json
{
  "success": true,
  "data": { ... bản ghi sau khi cập nhật ... }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Không có token | 401 | `UNAUTHORIZED` |
| Bản ghi không tồn tại | 404 | `ASSET_NOT_FOUND` |
| Bản ghi đã bị soft-delete | 404 | `ASSET_NOT_FOUND` |
| Số đơn mới trùng với bản ghi khác | 409 | `ASSET_NUMBER_EXISTS` |
| Dữ liệu không hợp lệ | 400 | `VALIDATION_ERROR` |

---

### 5.5 Xóa mềm (Soft Delete)

**`DELETE /ip-assets/:id`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT – role `staff` hoặc `admin` |

#### Mô tả

- Set `deleted_at = NOW()` – bản ghi không xuất hiện ở public portal.
- Bản ghi vẫn còn trong DB và có thể restore.
- Ghi audit log với action `SOFT_DELETE`.

#### Response 204

Không có body.

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Không có token | 401 | `UNAUTHORIZED` |
| Bản ghi không tồn tại | 404 | `ASSET_NOT_FOUND` |
| Bản ghi đã bị soft-delete rồi | 404 | `ASSET_NOT_FOUND` |

---

### 5.6 Xóa cứng (Hard Delete)

**`DELETE /ip-assets/:id/hard`**

| | |
|---|---|
| **Tác nhân** | Admin |
| **Quyền** | Bearer JWT – role **`admin`** |

#### Mô tả

- Xóa vĩnh viễn khỏi DB (không thể khôi phục).
- Ghi audit log với action `HARD_DELETE`.

#### Response 204

Không có body.

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Không có token | 401 | `UNAUTHORIZED` |
| Role = Staff | 403 | `FORBIDDEN` |
| Bản ghi không tồn tại (kể cả đã xóa cứng) | 404 | `ASSET_NOT_FOUND` |

---

### 5.7 Khôi phục bản ghi đã xóa mềm

**`POST /ip-assets/:id/restore`**

| | |
|---|---|
| **Tác nhân** | Admin |
| **Quyền** | Bearer JWT – role **`admin`** |

#### Mô tả

- Set `deleted_at = NULL` để khôi phục bản ghi.
- Ghi audit log với action `RESTORE`.

#### Response 200

```json
{
  "success": true,
  "data": { "message": "Khôi phục bản ghi thành công" }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Không có token | 401 | `UNAUTHORIZED` |
| Role = Staff | 403 | `FORBIDDEN` |
| ID không tồn tại | 404 | `ASSET_NOT_FOUND` |
| Bản ghi chưa bị xóa mềm | 422 | `UNPROCESSABLE_ENTITY` |

---

## 6. SEARCH – Tìm kiếm toàn văn

### 6.1 Tìm kiếm cơ bản & nâng cao

**`GET /search`**

| | |
|---|---|
| **Tác nhân** | Guest, Staff, Admin |
| **Quyền** | Công khai |

> Endpoint này tối ưu hóa cho tìm kiếm toàn văn qua Elasticsearch (pha 2) hoặc PostgreSQL LIKE (pha 1). Khác với `GET /ip-assets` ở chỗ trả thêm `highlights` và `facets` (bộ đếm lọc).

#### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|:--------:|-------|
| `q` | string | ✅ | Từ khóa tìm kiếm; min 1 ký tự |
| `asset_type` | string/array | ❌ | Lọc loại đối tượng |
| `status` | string | ❌ | Lọc trạng thái |
| `district_code` | string | ❌ | Lọc theo huyện |
| `application_date_from` | date | ❌ | Từ ngày nộp đơn |
| `application_date_to` | date | ❌ | Đến ngày nộp đơn |
| `page` | integer | ❌ | default=1 |
| `limit` | integer | ❌ | default=20, max=100 |

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "asset_type": "trademark",
      "title": "Nhãn hiệu <em>DALAT</em> MILK",
      "applicant_name": "...",
      "status": "granted",
      "highlight": {
        "title": ["Nhãn hiệu <em>DALAT</em> MILK"]
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "totalPages": 2
  },
  "facets": {
    "asset_type": {
      "trademark": 20,
      "patent": 10,
      "copyright": 5
    },
    "status": {
      "granted": 25,
      "pending_formal": 10
    }
  }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| `q` rỗng hoặc thiếu | 400 | `VALIDATION_ERROR` |
| Vượt rate limit | 429 | `TOO_MANY_REQUESTS` |

### 6.2 Gợi ý tự động (Autocomplete)

**`GET /search/suggest`**

| | |
|---|---|
| **Tác nhân** | Guest, Staff, Admin |
| **Quyền** | Công khai |

#### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|:--------:|-------|
| `q` | string | ✅ | Prefix để gợi ý; min 3 ký tự |
| `asset_type` | string | ❌ | Giới hạn loại đối tượng |

#### Response 200

```json
{
  "success": true,
  "data": [
    { "id": "...", "title": "Nhãn hiệu DALAT MILK", "asset_type": "trademark" },
    { "id": "...", "title": "Nhãn hiệu DALAT LOVE", "asset_type": "trademark" }
  ]
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| `q` < 3 ký tự | 400 | `VALIDATION_ERROR` |

---

## 7. USERS – Quản lý tài khoản

> Toàn bộ mục này yêu cầu role **Admin**.

### 7.1 Lấy danh sách tài khoản

**`GET /users`**

| | |
|---|---|
| **Tác nhân** | Admin |
| **Quyền** | Bearer JWT – role `admin` |

#### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|:--------:|-------|
| `page` | integer | ❌ | default=1 |
| `limit` | integer | ❌ | default=20, max=100 |
| `q` | string | ❌ | Tìm theo username, email, full_name |
| `role` | string | ❌ | Lọc theo role: `admin` \| `staff` |
| `is_active` | boolean | ❌ | Lọc active/inactive |

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-...",
      "username": "staff_nguyen",
      "email": "nguyen@shtt.bacninh.gov.vn",
      "full_name": "Nguyễn Văn A",
      "role": "staff",
      "is_active": true,
      "last_login_at": "2026-04-20T09:00:00.000Z",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Không có token | 401 | `UNAUTHORIZED` |
| Role = Staff | 403 | `FORBIDDEN` |

---

### 7.2 Tạo tài khoản

**`POST /users`**

| | |
|---|---|
| **Tác nhân** | Admin |
| **Quyền** | Bearer JWT – role `admin` |

#### Request Body

```json
{
  "username": "staff_tran",
  "email": "tran@shtt.bacninh.gov.vn",
  "password": "Secure@123456",
  "full_name": "Trần Thị B",
  "role": "staff"
}
```

| Trường | Bắt buộc | Validate |
|--------|:--------:|---------|
| `username` | ✅ | Không rỗng; min 3, max 100; chỉ chứa `[a-zA-Z0-9_]`; **UNIQUE** |
| `email` | ✅ | Format email hợp lệ; max 255; **UNIQUE** |
| `password` | ✅ | min 8, max 255; phải có chữ hoa, chữ thường, số, ký tự đặc biệt |
| `full_name` | ✅ | Không rỗng; max 255 |
| `role` | ✅ | Enum `UserRole`: `admin` \| `staff` |

#### Response 201

```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "username": "staff_tran",
    "email": "tran@shtt.bacninh.gov.vn",
    "full_name": "Trần Thị B",
    "role": "staff",
    "is_active": true,
    "created_at": "2026-04-22T10:00:00.000Z"
  }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Username đã tồn tại | 409 | `USER_USERNAME_EXISTS` |
| Email đã tồn tại | 409 | `USER_EMAIL_EXISTS` |
| Password không đủ độ mạnh | 400 | `VALIDATION_ERROR` |
| Role = Staff | 403 | `FORBIDDEN` |

---

### 7.3 Xem chi tiết tài khoản

**`GET /users/:id`**

| | |
|---|---|
| **Tác nhân** | Admin |
| **Quyền** | Bearer JWT – role `admin` |

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "...",
    "username": "staff_tran",
    "email": "tran@shtt.bacninh.gov.vn",
    "full_name": "Trần Thị B",
    "role": "staff",
    "is_active": true,
    "failed_login_count": 0,
    "locked_until": null,
    "last_login_at": "2026-04-21T14:00:00.000Z",
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-04-21T14:00:00.000Z"
  }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| ID không tồn tại | 404 | `USER_NOT_FOUND` |
| Role = Staff | 403 | `FORBIDDEN` |

---

### 7.4 Cập nhật tài khoản

**`PATCH /users/:id`**

| | |
|---|---|
| **Tác nhân** | Admin |
| **Quyền** | Bearer JWT – role `admin` |

#### Request Body (tất cả optional)

```json
{
  "full_name": "Trần Thị B (cập nhật)",
  "email": "tran.new@shtt.bacninh.gov.vn",
  "role": "admin",
  "is_active": false
}
```

| Trường | Validate |
|--------|---------|
| `full_name` | max 255 |
| `email` | Format email; **UNIQUE** |
| `role` | Enum `UserRole` |
| `is_active` | boolean |

#### Response 200

```json
{
  "success": true,
  "data": { ... tài khoản sau cập nhật ... }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| ID không tồn tại | 404 | `USER_NOT_FOUND` |
| Email mới trùng | 409 | `USER_EMAIL_EXISTS` |
| Role = Staff | 403 | `FORBIDDEN` |

---

### 7.5 Khóa / Mở khóa tài khoản

**`PATCH /users/:id/toggle-active`**

| | |
|---|---|
| **Tác nhân** | Admin |
| **Quyền** | Bearer JWT – role `admin` |

#### Mô tả

Đảo giá trị `is_active`. Nếu đang `true` → set `false` (khóa), và ngược lại.

#### Response 200

```json
{
  "success": true,
  "data": { "id": "...", "is_active": false, "message": "Tài khoản đã bị khóa" }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Admin tự khóa chính mình | 422 | `UNPROCESSABLE_ENTITY` |
| ID không tồn tại | 404 | `USER_NOT_FOUND` |

---

### 7.6 Reset mật khẩu

**`POST /users/:id/reset-password`**

| | |
|---|---|
| **Tác nhân** | Admin |
| **Quyền** | Bearer JWT – role `admin` |

#### Request Body

```json
{
  "new_password": "NewSecure@123456"
}
```

| Trường | Validate |
|--------|---------|
| `new_password` | min 8; có chữ hoa, chữ thường, số, ký tự đặc biệt |

#### Response 200

```json
{
  "success": true,
  "data": { "message": "Đặt lại mật khẩu thành công" }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| ID không tồn tại | 404 | `USER_NOT_FOUND` |
| Password không đủ mạnh | 400 | `VALIDATION_ERROR` |

---

## 8. CRAFT VILLAGES – Làng nghề

> Làng nghề là module dữ liệu liên kết đặc thù Bắc Ninh (không phải đối tượng SHTT theo Luật SHTT). Có bảng riêng `craft_villages`.

### 8.1 Lấy danh sách làng nghề

**`GET /craft-villages`**

| | |
|---|---|
| **Tác nhân** | Guest, Staff, Admin |
| **Quyền** | Công khai |

#### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|:--------:|-------|
| `page` | integer | ❌ | default=1 |
| `limit` | integer | ❌ | default=20, max=100 |
| `q` | string | ❌ | Tìm theo tên làng nghề, sản phẩm |
| `district_code` | string | ❌ | Lọc theo huyện |

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-...",
      "village_name": "Làng nghề gốm Phù Lãng",
      "products": ["gốm sứ", "đồ gia dụng"],
      "address": "Phù Lãng, Quế Võ, Bắc Ninh",
      "district_code": "BN.QV",
      "recognition_number": "56/QĐ-UBND",
      "recognition_date": "2010-03-15",
      "representative_image": "https://minio.../phu-lang.jpg"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 62, "totalPages": 4 }
}
```

---

### 8.2 Xem chi tiết làng nghề

**`GET /craft-villages/:id`**

| | |
|---|---|
| **Tác nhân** | Guest, Staff, Admin |
| **Quyền** | Công khai |

#### Response 200

```json
{
  "success": true,
  "data": {
    "id": "uuid-...",
    "village_name": "Làng nghề gốm Phù Lãng",
    "products": ["gốm sứ"],
    "address": "Phù Lãng, Quế Võ, Bắc Ninh",
    "district_code": "BN.QV",
    "recognition_number": "56/QĐ-UBND",
    "recognition_date": "2010-03-15",
    "description": "Gốm Phù Lãng nổi tiếng với nước men đặc trưng màu da lươn...",
    "representative_image": "https://minio.../phu-lang.jpg",
    "related_assets": [
      { "id": "...", "title": "Nhãn hiệu tập thể Gốm Phù Lãng", "asset_type": "trademark" }
    ]
  }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| ID không tồn tại | 404 | `NOT_FOUND` |

---

### 8.3 Tạo mới làng nghề

**`POST /craft-villages`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT – role `staff` hoặc `admin` |

#### Request Body

```json
{
  "village_name": "Làng nghề đúc đồng Đại Bái",
  "products": ["đồ đồng mỹ nghệ", "nhạc cụ"],
  "address": "Đại Bái, Gia Bình, Bắc Ninh",
  "district_code": "BN.GB",
  "recognition_number": "78/QĐ-UBND",
  "recognition_date": "2008-07-20",
  "description": "Làng nghề đúc đồng truyền thống hơn 900 năm lịch sử...",
  "representative_image": "https://minio.../dai-bai.jpg"
}
```

| Trường | Bắt buộc | Validate |
|--------|:--------:|---------|
| `village_name` | ✅ | Không rỗng; max 255 |
| `products` | ✅ | Array string, ít nhất 1 phần tử |
| `address` | ✅ | Không rỗng |
| `district_code` | ✅ | FK → ref_districts |
| `recognition_number` | ❌ | max 50 |
| `recognition_date` | ❌ | ISO 8601 date |
| `description` | ❌ | Text |
| `representative_image` | ❌ | URL hợp lệ |

#### Response 201

```json
{ "success": true, "data": { ... làng nghề mới ... } }
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| `district_code` không tồn tại | 422 | `UNPROCESSABLE_ENTITY` |
| Thiếu trường bắt buộc | 400 | `VALIDATION_ERROR` |

---

### 8.4 Cập nhật làng nghề

**`PATCH /craft-villages/:id`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |

Tất cả trường optional. Response 200 với bản ghi mới nhất.

---

### 8.5 Xóa mềm làng nghề

**`DELETE /craft-villages/:id`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |

Response 204.

---

## 9. DASHBOARD – Thống kê & Cảnh báo

> Chỉ dành cho Staff và Admin (yêu cầu đăng nhập).

### 9.1 Thống kê tổng quan

**`GET /dashboard/stats`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |

#### Response 200

```json
{
  "success": true,
  "data": {
    "total": 1250,
    "by_type": {
      "copyright": 320,
      "gi": 15,
      "trademark": 580,
      "patent": 210,
      "design": 125,
      "craft": 62
    },
    "by_status": {
      "draft": 30,
      "pending_formal": 45,
      "published": 120,
      "granted": 980,
      "refused": 50,
      "withdrawn": 20,
      "lapsed": 5
    },
    "craft_villages_total": 62,
    "updated_at": "2026-04-22T06:00:00.000Z"
  }
}
```

---

### 9.2 Bản ghi sắp hết hạn

**`GET /dashboard/expiring`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |

#### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|:--------:|-------|
| `days` | integer | ❌ | Số ngày tới để cảnh báo; default=90; max=365 |

#### Response 200

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "asset_type": "trademark",
      "title": "Nhãn hiệu ABC",
      "grant_number": "12345",
      "expiry_date": "2026-06-01",
      "days_remaining": 40,
      "applicant_name": "Công ty TNHH ABC"
    }
  ],
  "meta": { "total": 12, "days_threshold": 90 }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Không có token | 401 | `UNAUTHORIZED` |
| `days` < 1 hoặc > 365 | 400 | `VALIDATION_ERROR` |

---

### 9.3 Thống kê theo thời gian

**`GET /dashboard/timeline`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |

#### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|:--------:|-------|
| `year` | integer | ❌ | Năm thống kê; default = năm hiện tại |
| `groupBy` | string | ❌ | `month` \| `quarter`; default = `month` |
| `asset_type` | string | ❌ | Lọc theo loại |

#### Response 200

```json
{
  "success": true,
  "data": {
    "year": 2025,
    "groupBy": "month",
    "series": [
      { "period": "2025-01", "filed": 45, "granted": 30 },
      { "period": "2025-02", "filed": 52, "granted": 25 }
    ]
  }
}
```

---

## 10. REFERENCE DATA – Dữ liệu tra cứu

> Tất cả public – không cần đăng nhập. Dùng để fill dropdown trong form nhập liệu.

### 10.1 Danh mục tỉnh/thành

**`GET /ref/provinces`**

#### Response 200

```json
{
  "success": true,
  "data": [
    { "code": "BN", "name_vi": "Bắc Ninh", "name_en": "Bac Ninh" }
  ]
}
```

---

### 10.2 Danh mục huyện/quận

**`GET /ref/districts`**

#### Query Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `province_code` | string | Lọc theo tỉnh |

#### Response 200

```json
{
  "success": true,
  "data": [
    { "code": "BN.TT", "name_vi": "TP. Bắc Ninh", "province_code": "BN" },
    { "code": "BN.QV", "name_vi": "Quế Võ", "province_code": "BN" }
  ]
}
```

---

### 10.3 Phân loại Nice (Nhãn hiệu)

**`GET /ref/nice-classes`**

#### Response 200

```json
{
  "success": true,
  "data": [
    { "class_number": 1, "description_vi": "Hóa chất dùng trong công nghiệp, khoa học..." },
    { "class_number": 25, "description_vi": "Quần áo, giày dép, mũ nón" }
  ]
}
```

---

### 10.4 Phân loại IPC (Sáng chế)

**`GET /ref/ipc-codes`**

#### Query Parameters

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `q` | string | Tìm kiếm mã hoặc mô tả |
| `parent` | string | Lấy mã con của một nhóm cha (vd: `A61K`) |

---

### 10.5 Phân loại Locarno (Kiểu dáng công nghiệp)

**`GET /ref/locarno-codes`**

---

### 10.6 Phân loại Vienna (Nhãn hiệu – yếu tố hình)

**`GET /ref/vienna-codes`**

---

### 10.7 Trạng thái hồ sơ

**`GET /ref/statuses`**

#### Response 200

```json
{
  "success": true,
  "data": [
    { "code": "draft", "name_vi": "Bản nháp" },
    { "code": "pending_formal", "name_vi": "Đang thẩm định hình thức" },
    { "code": "granted", "name_vi": "Đã cấp bằng/GCN" }
  ]
}
```

---

## 11. UPLOAD – Hình ảnh & File đính kèm

### 11.1 Upload hình ảnh đối tượng SHTT

**`POST /ip-assets/:id/images`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |
| **Content-Type** | `multipart/form-data` |

#### Request (form-data)

| Trường | Kiểu | Bắt buộc | Validate |
|--------|------|:--------:|---------|
| `file` | File | ✅ | MIME: `image/jpeg`, `image/png`, `image/webp`; max **5MB**; kiểm tra magic bytes |
| `image_type` | string | ❌ | Enum: `logo` \| `main` \| `front` \| `back` \| `top` \| `bottom` \| `side_left` \| `side_right` \| `perspective` \| `cross_section` \| `detail` \| `other` |
| `is_primary` | boolean | ❌ | Ảnh đại diện (default false) |

#### Response 201

```json
{
  "success": true,
  "data": {
    "id": "img-uuid",
    "asset_id": "asset-uuid",
    "image_url": "https://minio.shtt.bacninh.gov.vn/images/...",
    "image_type": "logo",
    "file_name": "logo.png",
    "file_size_kb": 120,
    "mime_type": "image/png",
    "width_px": 800,
    "height_px": 600
  }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| File vượt 5MB | 400 | `UPLOAD_FILE_TOO_LARGE` |
| File không phải ảnh hợp lệ | 400 | `UPLOAD_FILE_TYPE_INVALID` |
| `id` bản ghi không tồn tại | 404 | `ASSET_NOT_FOUND` |

---

### 11.2 Upload file tài liệu

**`POST /ip-assets/:id/documents`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |
| **Content-Type** | `multipart/form-data` |

#### Request (form-data)

| Trường | Kiểu | Bắt buộc | Validate |
|--------|------|:--------:|---------|
| `file` | File | ✅ | MIME: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`; max **20MB** |
| `doc_type` | string | ❌ | `description` \| `claim` \| `work_sample` \| `certificate` \| `other` |

#### Response 201

```json
{
  "success": true,
  "data": {
    "id": "doc-uuid",
    "asset_id": "asset-uuid",
    "doc_url": "https://minio.../documents/...",
    "doc_type": "description",
    "file_name": "mo-ta-sang-che.pdf",
    "file_size_kb": 4096
  }
}
```

---

### 11.3 Xóa hình ảnh / tài liệu

**`DELETE /ip-assets/:id/images/:imageId`**  
**`DELETE /ip-assets/:id/documents/:docId`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |

Response 204.

---

## 12. EXPORT / IMPORT – Xuất nhập hàng loạt

### 12.1 Tải template Excel

**`GET /import/template`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |

#### Query Parameters

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|:--------:|-------|
| `asset_type` | string | ✅ | Loại đối tượng; Enum `AssetType` |

#### Response

- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File tải về: `template_<asset_type>.xlsx`

---

### 12.2 Import từ Excel

**`POST /import`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |
| **Content-Type** | `multipart/form-data` |

#### Request (form-data)

| Trường | Kiểu | Bắt buộc | Validate |
|--------|------|:--------:|---------|
| `file` | File | ✅ | MIME: `.xlsx`; max 50MB |
| `asset_type` | string | ✅ | Enum `AssetType` |
| `on_duplicate` | string | ❌ | `skip` \| `update`; default = `skip` |

#### Response 200

```json
{
  "success": true,
  "data": {
    "total_rows": 150,
    "imported": 140,
    "skipped": 8,
    "failed": 2,
    "errors": [
      { "row": 15, "message": "Thiếu trường 'title'" },
      { "row": 32, "message": "Số đơn '4-2024-00001' đã tồn tại" }
    ]
  }
}
```

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| File không phải xlsx | 400 | `UPLOAD_FILE_TYPE_INVALID` |
| File vượt 50MB | 400 | `UPLOAD_FILE_TOO_LARGE` |
| `asset_type` không hợp lệ | 400 | `VALIDATION_ERROR` |

---

### 12.3 Xuất dữ liệu (Excel)

**`GET /export`**

| | |
|---|---|
| **Tác nhân** | Staff, Admin |
| **Quyền** | Bearer JWT |

#### Query Parameters

Nhận các tham số lọc giống `GET /ip-assets` (asset_type, status, district_code, date ranges...) cộng thêm:

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|:--------:|-------|
| `format` | string | ❌ | `excel` \| `csv`; default = `excel` |
| `ids` | string | ❌ | Danh sách UUID cách nhau bởi dấu phẩy (export chọn lọc) |

> **Giới hạn:** Guest không được phép export. Staff/Admin: tối đa 5000 bản ghi/lần.

#### Response

- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` hoặc `text/csv`
- Ghi audit log với action `EXPORT`.

#### Trường hợp lỗi

| Điều kiện | HTTP | Code |
|-----------|------|------|
| Kết quả > 5000 bản ghi | 422 | `UNPROCESSABLE_ENTITY` |
| Không có token | 401 | `UNAUTHORIZED` |

---

### 12.4 Xuất dữ liệu (PDF đơn lẻ)

**`GET /ip-assets/:id/export-pdf`**

| | |
|---|---|
| **Tác nhân** | Guest, Staff, Admin |
| **Quyền** | Công khai |

#### Mô tả

Xuất 1 bản ghi ra PDF định dạng chuẩn WIPO (có mã INID).  
Rate limit nghiêm: Guest 10 req/phút/IP.

#### Response

- Content-Type: `application/pdf`
- File: `shtt_<asset_type>_<id>.pdf`

---

## 13. Bảng tóm tắt tất cả API

| # | Method | Endpoint | Tên | Guest | Staff | Admin |
|---|--------|----------|-----|:-----:|:-----:|:-----:|
| **AUTH** |
| 1 | POST | `/auth/login` | Đăng nhập | ✅ | ✅ | ✅ |
| 2 | POST | `/auth/refresh` | Làm mới token | ✅ | ✅ | ✅ |
| 3 | POST | `/auth/logout` | Đăng xuất | ❌ | ✅ | ✅ |
| 4 | GET | `/auth/me` | Thông tin bản thân | ❌ | ✅ | ✅ |
| **IP ASSETS** |
| 5 | GET | `/ip-assets` | Danh sách đối tượng SHTT | ✅ | ✅ | ✅ |
| 6 | GET | `/ip-assets/:id` | Chi tiết đối tượng SHTT | ✅ | ✅ | ✅ |
| 7 | POST | `/ip-assets` | Tạo mới | ❌ | ✅ | ✅ |
| 8 | PATCH | `/ip-assets/:id` | Cập nhật | ❌ | ✅ | ✅ |
| 9 | DELETE | `/ip-assets/:id` | Xóa mềm | ❌ | ✅ | ✅ |
| 10 | DELETE | `/ip-assets/:id/hard` | Xóa cứng | ❌ | ❌ | ✅ |
| 11 | POST | `/ip-assets/:id/restore` | Khôi phục | ❌ | ❌ | ✅ |
| 12 | POST | `/ip-assets/:id/images` | Upload hình ảnh | ❌ | ✅ | ✅ |
| 13 | DELETE | `/ip-assets/:id/images/:imgId` | Xóa hình ảnh | ❌ | ✅ | ✅ |
| 14 | POST | `/ip-assets/:id/documents` | Upload tài liệu | ❌ | ✅ | ✅ |
| 15 | DELETE | `/ip-assets/:id/documents/:docId` | Xóa tài liệu | ❌ | ✅ | ✅ |
| 16 | GET | `/ip-assets/:id/export-pdf` | Xuất PDF đơn lẻ | ✅ | ✅ | ✅ |
| **SEARCH** |
| 17 | GET | `/search` | Tìm kiếm toàn văn | ✅ | ✅ | ✅ |
| 18 | GET | `/search/suggest` | Gợi ý autocomplete | ✅ | ✅ | ✅ |
| **USERS** |
| 19 | GET | `/users` | Danh sách tài khoản | ❌ | ❌ | ✅ |
| 20 | POST | `/users` | Tạo tài khoản | ❌ | ❌ | ✅ |
| 21 | GET | `/users/:id` | Chi tiết tài khoản | ❌ | ❌ | ✅ |
| 22 | PATCH | `/users/:id` | Cập nhật tài khoản | ❌ | ❌ | ✅ |
| 23 | PATCH | `/users/:id/toggle-active` | Khóa/mở khóa | ❌ | ❌ | ✅ |
| 24 | POST | `/users/:id/reset-password` | Reset mật khẩu | ❌ | ❌ | ✅ |
| **CRAFT VILLAGES** |
| 25 | GET | `/craft-villages` | Danh sách làng nghề | ✅ | ✅ | ✅ |
| 26 | GET | `/craft-villages/:id` | Chi tiết làng nghề | ✅ | ✅ | ✅ |
| 27 | POST | `/craft-villages` | Tạo làng nghề | ❌ | ✅ | ✅ |
| 28 | PATCH | `/craft-villages/:id` | Cập nhật làng nghề | ❌ | ✅ | ✅ |
| 29 | DELETE | `/craft-villages/:id` | Xóa làng nghề | ❌ | ✅ | ✅ |
| **DASHBOARD** |
| 30 | GET | `/dashboard/stats` | Thống kê tổng quan | ❌ | ✅ | ✅ |
| 31 | GET | `/dashboard/expiring` | Bản ghi sắp hết hạn | ❌ | ✅ | ✅ |
| 32 | GET | `/dashboard/timeline` | Thống kê theo thời gian | ❌ | ✅ | ✅ |
| **REFERENCE DATA** |
| 33 | GET | `/ref/provinces` | Danh mục tỉnh/thành | ✅ | ✅ | ✅ |
| 34 | GET | `/ref/districts` | Danh mục huyện/quận | ✅ | ✅ | ✅ |
| 35 | GET | `/ref/nice-classes` | Phân loại Nice | ✅ | ✅ | ✅ |
| 36 | GET | `/ref/ipc-codes` | Phân loại IPC | ✅ | ✅ | ✅ |
| 37 | GET | `/ref/locarno-codes` | Phân loại Locarno | ✅ | ✅ | ✅ |
| 38 | GET | `/ref/vienna-codes` | Phân loại Vienna | ✅ | ✅ | ✅ |
| 39 | GET | `/ref/statuses` | Danh mục trạng thái | ✅ | ✅ | ✅ |
| **IMPORT / EXPORT** |
| 40 | GET | `/import/template` | Tải template Excel | ❌ | ✅ | ✅ |
| 41 | POST | `/import` | Import từ Excel | ❌ | ✅ | ✅ |
| 42 | GET | `/export` | Xuất Excel/CSV hàng loạt | ❌ | ✅ | ✅ |
| **SYSTEM** |
| 43 | GET | `/health` | Health check | ✅ | ✅ | ✅ |

---

## Phụ lục – Cấu trúc `meta` theo từng loại đối tượng

### Bản quyền tác giả (`copyright`)

```json
{
  "meta": {
    "work_type": "literary",
    "authors": "Nguyễn Văn A, Trần Thị B",
    "author_address": "123 Đường X, TP. Bắc Ninh",
    "owner_name": "Công ty TNHH ABC",
    "owner_address": "456 Đường Y, Bắc Ninh",
    "certificate_number": "GCN-2025-001",
    "certificate_date": "2025-01-15",
    "work_sample_url": "https://minio.../copyright/sample.pdf"
  }
}
```

### Chỉ dẫn địa lý (`gi`)

```json
{
  "meta": {
    "product_name": "Gốm Phù Lãng",
    "geographical_area": "Xã Phù Lãng, Huyện Quế Võ, Tỉnh Bắc Ninh",
    "managing_org": "Hội Gốm sứ Phù Lãng",
    "quality_characteristics": "Đặc điểm lý hóa, nguồn gốc địa lý...",
    "description_doc_url": "https://minio.../gi/ban-mo-ta.pdf"
  }
}
```

### Nhãn hiệu (`trademark`)

```json
{
  "meta": {
    "application_type": "collective",
    "logo_image_url": "https://minio.../trademark/logo.png",
    "vienna_codes": ["27.05.01", "26.04.01"],
    "nice_classes": [29, 30, 35],
    "goods_services_description": "Thực phẩm chế biến, đồ uống...",
    "is_colored": true
  }
}
```

### Sáng chế / Giải pháp hữu ích (`patent`)

```json
{
  "meta": {
    "patent_type": "invention",
    "inventors": ["Nguyễn Văn C", "Lê Thị D"],
    "ipc_codes": ["A61K 31/00", "C07D 213/00"],
    "abstract_text": "Sáng chế liên quan đến phương pháp...",
    "claims": "Yêu cầu bảo hộ 1: ...",
    "full_text_url": "https://minio.../patent/fulltext.pdf",
    "independent_claims_count": 3
  }
}
```

### Kiểu dáng công nghiệp (`design`)

```json
{
  "meta": {
    "creators": ["Trần Văn E"],
    "locarno_codes": ["14-01", "14-02"],
    "description": "Kiểu dáng bình gốm hình trụ...",
    "design_variants_count": 4,
    "renewal_count": 0
  }
}
```

---

*Tài liệu API Specification v1.0 – Hệ thống CSDL SHTT tỉnh Bắc Ninh*  
*Ngày: 22/04/2026*
