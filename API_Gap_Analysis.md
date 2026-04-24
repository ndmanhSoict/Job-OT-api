# PHÂN TÍCH GAP – API & DATABASE
# Hệ thống CSDL SHTT tỉnh Bắc Ninh

> **Ngày phân tích:** 24/04/2026  
> **Căn cứ đối chiếu:**  
> - Yêu cầu chức năng: `Tai_lieu_tong_quan_CSDL_SHTT_BacNinh.md`  
> - API spec hiện có: `API_Specification.md` (43 endpoints)  
> - Schema DB: `db.sql`  
> - Code đã implement: `src/modules/**/routes/*.routes.ts`  
> - Coding rule: `BE_Coding_Rule.md`, `CLAUDE.md`

---

## I. TRẠNG THÁI HIỆN TẠI – ĐÃ ĐỦ

Tất cả **43 endpoints** trong `API_Specification.md` đã được đăng ký đầy đủ trong routes:

| Nhóm | Đã implement |
|------|:---:|
| AUTH (4 endpoints) | ✅ |
| IP ASSETS – CRUD + Hard Delete + Restore + PDF export (7) | ✅ |
| IP ASSETS – Upload/Delete Images + Documents (4) | ✅ |
| SEARCH + SUGGEST (2) | ✅ |
| USERS – CRUD + Toggle + Reset Password (6) | ✅ |
| CRAFT VILLAGES – CRUD (5) | ✅ |
| DASHBOARD – stats/expiring/timeline (3) | ✅ |
| REF DATA – provinces/districts/statuses/nice/ipc/locarno/vienna (7) | ✅ |
| IMPORT/EXPORT – template/import/export (3) | ✅ |
| HEALTH CHECK (1) | ✅ |

---

## II. CÁC GAP PHÁT HIỆN

### B. GAP API ENDPOINTS – THIẾU TRONG API_SPECIFICATION.MD

#### B1. `GET /ref/copyright-work-types` – QUAN TRỌNG
- **Vấn đề:** DB có bảng `ref_copyright_work_types` (12 loại tác phẩm). FE cần endpoint này để populate dropdown khi tạo/sửa bản quyền. Các ref khác (nice, ipc, locarno, vienna) đã có endpoint, nhưng loại này bị bỏ sót.
- **Auth:** Public
- **Spec đề xuất:**

```
GET /ref/copyright-work-types
Response 200:
{
  "success": true,
  "data": [
    { "code": "literary",  "name_vi": "Tác phẩm văn học",      "name_en": "Literary Work" },
    { "code": "software",  "name_vi": "Chương trình máy tính", "name_en": "Computer Program" }
    ...
  ]
}
```

---

#### B2. `GET /ip-assets/:id/images` – CẦN THIẾT
- **Vấn đề:** Có API upload (`POST`) và delete (`DELETE`) ảnh nhưng **không có API lấy danh sách ảnh** của một asset. FE không biết ảnh nào đã tồn tại.
- **Auth:** Public (Guest/Staff/Admin)
- **Spec đề xuất:**

```
GET /ip-assets/:id/images
Response 200:
{
  "success": true,
  "data": [
    {
      "id": "img-uuid",
      "image_url": "https://minio.../...",
      "image_type": "logo",
      "is_primary": true,
      "file_name": "logo.png",
      "file_size_kb": 120,
      "sort_order": 1
    }
  ]
}
```

---

#### B3. `GET /ip-assets/:id/documents` – CẦN THIẾT
- **Vấn đề:** Tương tự B2, không có API lấy danh sách tài liệu đính kèm.
- **Auth:** Staff/Admin (tài liệu thường có nội dung nhạy cảm hơn ảnh)
- **Spec đề xuất:**

```
GET /ip-assets/:id/documents
Authorization: Bearer JWT
Response 200:
{
  "success": true,
  "data": [
    {
      "id": "doc-uuid",
      "doc_url": "https://minio.../...",
      "doc_type": "description",
      "file_name": "ban-mo-ta.pdf",
      "file_size_kb": 4096
    }
  ]
}
```

---

#### B4. `GET /audit-logs` – YÊU CẦU CHỨC NĂNG (FR-ADM-05)
- **Vấn đề:** FR-ADM-05 quy định Staff xem được audit log của mình, Admin xem tất cả. Không có endpoint nào thực hiện điều này.
- **Phụ thuộc:** Cần tạo bảng `audit_logs` (xem A1).
- **Auth:** Staff (own only) / Admin (all)

```
GET /audit-logs
Authorization: Bearer JWT (Staff hoặc Admin)
Query params:
  - entity_type (string, optional)
  - entity_id   (UUID, optional)
  - action      (enum, optional)
  - user_id     (UUID, optional – chỉ Admin dùng để xem log của người khác)
  - date_from   (date, optional)
  - date_to     (date, optional)
  - page, limit

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "user_id": "...",
      "username": "staff_nguyen",
      "action": "UPDATE",
      "entity_type": "ip_assets",
      "entity_id": "...",
      "old_value": {},
      "new_value": {},
      "ip_address": "1.2.3.4",
      "created_at": "2026-04-22T10:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}

Lỗi:
- 401 nếu không có token
- 403 nếu Staff cố xem log của người khác (user_id != req.user.id)
```

---

#### B5. Organizations & Persons – LOOKUP API
- **Vấn đề:** Khi tạo IP asset, staff cần chọn chủ đơn (tổ chức/cá nhân) qua `applicant_org_id` hoặc `applicant_person_id`. Không có endpoint nào để tìm kiếm/lấy danh sách organizations và persons.
- **Tác động:** FE không thể populate dropdown "Chủ đơn"; phải nhập free text `applicant_name` thay vì FK → mất tính nhất quán dữ liệu.

**Các API cần thêm (tối thiểu để hoạt động):**

```
GET  /organizations            – Danh sách/tìm kiếm tổ chức (Public)
POST /organizations            – Tạo tổ chức mới (Staff+)
GET  /organizations/:id        – Chi tiết tổ chức (Public)
PATCH /organizations/:id       – Sửa tổ chức (Staff+)

GET  /persons                  – Danh sách/tìm kiếm cá nhân (Staff+)
POST /persons                  – Tạo cá nhân mới (Staff+)
GET  /persons/:id              – Chi tiết cá nhân (Staff+; ẩn CMND/SĐT với Public)
PATCH /persons/:id             – Sửa cá nhân (Staff+)
```

---

#### B6. Asset ↔ Craft Village Linking
- **Vấn đề:** DB có bảng junction `asset_craft_villages` (liên kết nhiều-nhiều IP Asset ↔ Làng nghề) nhưng không có API nào để quản lý quan hệ này.
- **Tác động:** Không thể gắn nhãn hiệu tập thể với làng nghề từ FE; field `related_assets` trong `GET /craft-villages/:id` không có dữ liệu.

```
GET    /ip-assets/:id/craft-villages           – Lấy danh sách làng nghề liên kết (Public)
POST   /ip-assets/:id/craft-villages/:villageId – Gắn liên kết (Staff+)
DELETE /ip-assets/:id/craft-villages/:villageId – Xóa liên kết (Staff+)
```

---

#### B7. `POST /auth/change-password` – BẢO MẬT NGƯỜI DÙNG
- **Vấn đề:** Admin có thể reset password của người khác, nhưng Staff không có cách tự đổi mật khẩu của mình. Đây là yêu cầu bảo mật cơ bản (FR-ADM-01 ngầm định).
- **Auth:** Staff hoặc Admin (chỉ đổi password của chính mình)

```
POST /auth/change-password
Authorization: Bearer JWT
Body:
{
  "current_password": "OldPass@123",
  "new_password":     "NewPass@456"
}
Response 200: { "success": true, "data": { "message": "Đổi mật khẩu thành công" } }
Lỗi:
- 401 nếu current_password sai
- 400 nếu new_password không đủ mạnh
```


### Sprint kế tiếp – MVP hoàn chỉnh (P1)
3. `GET /ref/copyright-work-types`
4. `GET /ip-assets/:id/images`
5. `GET /ip-assets/:id/documents`
6. `GET /audit-logs` (sau khi có bảng)
7. `POST /auth/change-password`
8. Organizations API: GET list, POST, GET :id, PATCH :id
9. Persons API: GET list, POST, GET :id, PATCH :id

### Sprint sau – Pha 1 đầy đủ (P2)
10. Asset ↔ Craft Village linking (3 endpoints)
11. Craft Village hard delete & restore
12. Dashboard top-applicants & top-groups
13. Guest export Excel (`GET /export/public`)

*Tài liệu gap analysis v1.0 – 24/04/2026*
