-- =============================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU TÀI SẢN SỞ HỮU TRÍ TUỆ TỈNH BẮC NINH
-- Database: MySQL 8.0+
-- Phiên bản: 1.0
-- Ngày: 20/04/2026
-- Tác giả: BA Team
-- Ghi chú: Bỏ audit_logs theo yêu cầu; sử dụng soft-delete; chuẩn WIPO ST.80/ST.86
-- =============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET time_zone = '+07:00';

CREATE DATABASE IF NOT EXISTS shtt_bacninh
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE shtt_bacninh;

-- Tắt kiểm tra FK trong quá trình khởi tạo
SET FOREIGN_KEY_CHECKS = 0;


-- =============================================================================
-- PHẦN 1: BẢNG NGƯỜI DÙNG HỆ THỐNG (Authentication & Authorization)
-- =============================================================================

CREATE TABLE users (
    id              CHAR(36)        NOT NULL DEFAULT (UUID()) COMMENT 'Primary key UUID',
    username        VARCHAR(100)    NOT NULL                  COMMENT 'Tên đăng nhập',
    email           VARCHAR(255)    NOT NULL                  COMMENT 'Email',
    password_hash   VARCHAR(255)    NOT NULL                  COMMENT 'Mật khẩu đã hash (bcrypt)',
    full_name       VARCHAR(255)    NOT NULL                  COMMENT 'Họ và tên đầy đủ',
    role            ENUM('admin','staff')
                                    NOT NULL DEFAULT 'staff'  COMMENT 'Vai trò: admin | staff',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1        COMMENT 'Tài khoản hoạt động',
    failed_login_count
                    TINYINT         NOT NULL DEFAULT 0        COMMENT 'Số lần đăng nhập sai liên tiếp',
    locked_until    DATETIME        NULL                      COMMENT 'Khóa tài khoản đến thời điểm này',
    last_login_at   DATETIME        NULL                      COMMENT 'Lần đăng nhập cuối',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME        NULL                      COMMENT 'Soft delete',

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_username (username),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng người dùng hệ thống (Admin và Staff)';


-- =============================================================================
-- PHẦN 2: DỮ LIỆU THAM CHIẾU (Reference / Lookup Tables)
-- =============================================================================

-- 2.1. Tỉnh / Thành phố
CREATE TABLE ref_provinces (
    code        VARCHAR(10)     NOT NULL    COMMENT 'Mã tỉnh (ví dụ: BN, HN)',
    name        VARCHAR(255)    NOT NULL    COMMENT 'Tên tỉnh/thành phố',
    name_en     VARCHAR(255)    NULL        COMMENT 'Tên tiếng Anh',
    region      VARCHAR(100)    NULL        COMMENT 'Vùng kinh tế',

    PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Danh mục tỉnh/thành phố Việt Nam';

INSERT INTO ref_provinces (code, name, name_en, region) VALUES
('BN',  'Bắc Ninh',     'Bac Ninh',         'Đồng bằng sông Hồng'),
('HN',  'Hà Nội',       'Ha Noi',           'Đồng bằng sông Hồng'),
('HCM', 'Hồ Chí Minh',  'Ho Chi Minh City', 'Đông Nam Bộ');
-- (Thêm đầy đủ 63 tỉnh/thành theo danh mục chính thức)


-- 2.2. Huyện / Quận (tối thiểu Bắc Ninh)
CREATE TABLE ref_districts (
    code            VARCHAR(10)     NOT NULL    COMMENT 'Mã huyện',
    province_code   VARCHAR(10)     NOT NULL    COMMENT 'FK → ref_provinces',
    name            VARCHAR(255)    NOT NULL    COMMENT 'Tên huyện/quận',
    name_en         VARCHAR(255)    NULL,

    PRIMARY KEY (code),
    KEY idx_districts_province (province_code),
    CONSTRAINT fk_districts_province
        FOREIGN KEY (province_code) REFERENCES ref_provinces(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Danh mục huyện/quận (tối thiểu Bắc Ninh)';

INSERT INTO ref_districts (code, province_code, name) VALUES
('BN-TP',   'BN', 'Thành phố Bắc Ninh'),
('BN-TT',   'BN', 'Thị xã Từ Sơn'),
('BN-YP',   'BN', 'Huyện Yên Phong'),
('BN-QV',   'BN', 'Huyện Quế Võ'),
('BN-TL',   'BN', 'Huyện Tiên Du'),
('BN-LT',   'BN', 'Huyện Lương Tài'),
('BN-GD',   'BN', 'Huyện Gia Bình'),
('BN-TH',   'BN', 'Huyện Thuận Thành');


-- 2.3. Trạng thái hồ sơ
CREATE TABLE ref_status (
    code        VARCHAR(50)     NOT NULL    COMMENT 'Mã trạng thái',
    name_vi     VARCHAR(255)    NOT NULL    COMMENT 'Tên tiếng Việt',
    name_en     VARCHAR(255)    NULL        COMMENT 'Tên tiếng Anh',
    description TEXT            NULL,
    sort_order  TINYINT         NOT NULL DEFAULT 0,

    PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Danh mục trạng thái hồ sơ SHTT';

INSERT INTO ref_status (code, name_vi, name_en, sort_order) VALUES
('draft',               'Bản nháp',                     'Draft',                    1),
('pending_formal',      'Đang thẩm định hình thức',     'Pending Formal Exam',      2),
('published',           'Đã công bố hợp lệ',            'Published',                3),
('pending_substantive', 'Đang thẩm định nội dung',      'Pending Substantive Exam', 4),
('granted',             'Đã cấp bằng/GCN',              'Granted',                  5),
('refused',             'Bị từ chối',                   'Refused',                  6),
('withdrawn',           'Rút đơn',                      'Withdrawn',                7),
('lapsed',              'Hết hiệu lực',                 'Lapsed',                   8);


-- 2.4. Loại hình tác phẩm (Bản quyền)
CREATE TABLE ref_copyright_work_types (
    code        VARCHAR(50)     NOT NULL,
    name_vi     VARCHAR(255)    NOT NULL,
    name_en     VARCHAR(255)    NULL,

    PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Loại hình tác phẩm bản quyền tác giả';

INSERT INTO ref_copyright_work_types (code, name_vi, name_en) VALUES
('literary',            'Tác phẩm văn học',             'Literary Work'),
('music',               'Tác phẩm âm nhạc',             'Musical Work'),
('drama',               'Tác phẩm sân khấu',            'Dramatic Work'),
('fine_art',            'Tác phẩm mỹ thuật',            'Fine Art Work'),
('applied_art',         'Tác phẩm mỹ thuật ứng dụng',  'Applied Art Work'),
('photo',               'Tác phẩm nhiếp ảnh',           'Photographic Work'),
('cinematograph',       'Tác phẩm điện ảnh',            'Cinematographic Work'),
('architecture',        'Tác phẩm kiến trúc',           'Architectural Work'),
('folklore',            'Tác phẩm văn học dân gian',    'Folklore Work'),
('software',            'Chương trình máy tính',        'Computer Program'),
('database',            'Sưu tập dữ liệu',              'Database'),
('map',                 'Bản đồ, sơ đồ',                'Map/Diagram');


-- 2.5. Phân loại Nice (Nhãn hiệu - 45 nhóm)
CREATE TABLE ref_nice_classification (
    class_no    TINYINT UNSIGNED NOT NULL   COMMENT 'Số nhóm (1-45)',
    description_vi
                TEXT            NOT NULL    COMMENT 'Mô tả tiếng Việt',
    description_en
                TEXT            NULL        COMMENT 'Mô tả tiếng Anh',

    PRIMARY KEY (class_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Phân loại Nice - 45 nhóm hàng hóa dịch vụ (cho nhãn hiệu)';

-- Dữ liệu đầy đủ 45 nhóm import riêng từ WIPO


-- 2.6. Phân loại Vienna (Nhãn hiệu - yếu tố hình)
CREATE TABLE ref_vienna_classification (
    code        VARCHAR(20)     NOT NULL    COMMENT 'Mã Vienna (ví dụ: 01.01.01)',
    level       TINYINT         NOT NULL    COMMENT 'Cấp phân loại (1=nhóm, 2=mục, 3=tiểu mục)',
    parent_code VARCHAR(20)     NULL        COMMENT 'Mã cha',
    description_vi
                VARCHAR(1000)   NOT NULL,
    description_en
                VARCHAR(1000)   NULL,

    PRIMARY KEY (code),
    KEY idx_vienna_parent (parent_code),
    KEY idx_vienna_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Phân loại Vienna - yếu tố hình nhãn hiệu';


-- 2.7. Phân loại IPC (Sáng chế)
CREATE TABLE ref_ipc_classification (
    code        VARCHAR(20)     NOT NULL    COMMENT 'Mã IPC (ví dụ: A01B 1/00)',
    level       TINYINT         NOT NULL    COMMENT '1=Phần, 2=Lớp, 3=Phân lớp, 4=Nhóm',
    parent_code VARCHAR(20)     NULL,
    description_vi
                VARCHAR(2000)   NOT NULL,
    description_en
                VARCHAR(2000)   NULL,

    PRIMARY KEY (code),
    KEY idx_ipc_parent (parent_code),
    KEY idx_ipc_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Phân loại IPC - Phân loại sáng chế quốc tế';


-- 2.8. Phân loại Locarno (Kiểu dáng công nghiệp - 32 nhóm)
CREATE TABLE ref_locarno_classification (
    code        VARCHAR(10)     NOT NULL    COMMENT 'Mã Locarno (ví dụ: 01-01)',
    level       TINYINT         NOT NULL    COMMENT '1=Nhóm (class), 2=Phân nhóm (subclass)',
    parent_code VARCHAR(10)     NULL,
    description_vi
                VARCHAR(1000)   NOT NULL,
    description_en
                VARCHAR(1000)   NULL,

    PRIMARY KEY (code),
    KEY idx_locarno_parent (parent_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Phân loại Locarno - 32 nhóm kiểu dáng công nghiệp';

-- Mẫu dữ liệu một số nhóm chính
INSERT INTO ref_locarno_classification (code, level, parent_code, description_vi, description_en) VALUES
('01',      1, NULL,   'Thực phẩm',                        'Foodstuffs'),
('02',      1, NULL,   'Hàng may mặc và vải',              'Articles of Clothing and Haberdashery'),
('03',      1, NULL,   'Đồ du lịch, hộp, ô dù',           'Travel Goods, Cases, Parasols and Personal Belongings'),
('06',      1, NULL,   'Đồ nội thất',                      'Furnishing'),
('07',      1, NULL,   'Hàng gia dụng',                    'Household Goods'),
('12',      1, NULL,   'Phương tiện vận chuyển',           'Means of Transport or Hoisting'),
('14',      1, NULL,   'Thiết bị ghi âm, truyền thông',   'Recording, Communication or Information Retrieval Equipment'),
('26',      1, NULL,   'Thiết bị chiếu sáng',              'Lighting Apparatus');


-- =============================================================================
-- PHẦN 3: TỔ CHỨC VÀ CÁ NHÂN (Organizations & Persons)
-- Dùng chung cho: Chủ đơn, Tác giả, Tổ chức quản lý GI
-- =============================================================================

-- 3.1. Tổ chức / Doanh nghiệp
CREATE TABLE organizations (
    id              CHAR(36)        NOT NULL DEFAULT (UUID()),
    org_name        VARCHAR(500)    NOT NULL    COMMENT 'Tên tổ chức/doanh nghiệp',
    org_name_en     VARCHAR(500)    NULL        COMMENT 'Tên tiếng Anh',
    org_type        ENUM('company','cooperative','association','state_agency','other')
                                    NOT NULL DEFAULT 'company' COMMENT 'Loại tổ chức',
    tax_code        VARCHAR(20)     NULL        COMMENT 'Mã số thuế',
    address         TEXT            NULL        COMMENT 'Địa chỉ đầy đủ',
    district_code   VARCHAR(10)     NULL        COMMENT 'FK → ref_districts',
    province_code   VARCHAR(10)     NULL DEFAULT 'BN' COMMENT 'FK → ref_provinces',
    phone           VARCHAR(20)     NULL,
    email           VARCHAR(255)    NULL,
    website         VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME        NULL,

    PRIMARY KEY (id),
    KEY idx_org_name (org_name(100)),
    KEY idx_org_taxcode (tax_code),
    KEY idx_org_province (province_code),
    KEY idx_org_district (district_code),
    CONSTRAINT fk_org_district
        FOREIGN KEY (district_code) REFERENCES ref_districts(code),
    CONSTRAINT fk_org_province
        FOREIGN KEY (province_code) REFERENCES ref_provinces(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng tổ chức/doanh nghiệp (chủ đơn, tổ chức quản lý GI...)';


-- 3.2. Cá nhân
CREATE TABLE persons (
    id              CHAR(36)        NOT NULL DEFAULT (UUID()),
    full_name       VARCHAR(255)    NOT NULL    COMMENT 'Họ và tên đầy đủ',
    full_name_en    VARCHAR(255)    NULL        COMMENT 'Tên tiếng Anh',
    id_number       VARCHAR(20)     NULL        COMMENT 'CMND/CCCD (ẩn ở public portal)',
    nationality     VARCHAR(100)    NULL DEFAULT 'Việt Nam' COMMENT 'Quốc tịch',
    address         TEXT            NULL,
    district_code   VARCHAR(10)     NULL,
    province_code   VARCHAR(10)     NULL DEFAULT 'BN',
    phone           VARCHAR(20)     NULL        COMMENT 'Ẩn ở public portal',
    email           VARCHAR(255)    NULL        COMMENT 'Ẩn ở public portal',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME        NULL,

    PRIMARY KEY (id),
    KEY idx_person_name (full_name),
    KEY idx_person_province (province_code),
    CONSTRAINT fk_person_district
        FOREIGN KEY (district_code) REFERENCES ref_districts(code),
    CONSTRAINT fk_person_province
        FOREIGN KEY (province_code) REFERENCES ref_provinces(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng cá nhân (tác giả, chủ đơn cá nhân...)';


-- =============================================================================
-- PHẦN 4: BẢNG LÕI CHUNG (ip_assets - Base Table)
-- Theo mô hình Table-per-Type: bảng này chứa các trường dùng chung
-- cho TẤT CẢ 5 nhóm đối tượng SHTT (bản quyền, GI, nhãn hiệu, SC, KDCN)
-- Làng nghề là module riêng
-- =============================================================================

CREATE TABLE ip_assets (
    -- --- Định danh ---
    id                  CHAR(36)        NOT NULL DEFAULT (UUID())    COMMENT 'PK UUID',
    asset_type          ENUM('copyright','gi','trademark','patent','design')
                                        NOT NULL                     COMMENT 'Loại đối tượng SHTT',

    -- --- Thông tin chung ---
    title               VARCHAR(1000)   NOT NULL                     COMMENT '(INID 54) Tên đối tượng',

    -- --- Thông tin đơn đăng ký ---
    application_number  VARCHAR(100)    NULL                         COMMENT '(INID 21) Số đơn',
    application_date    DATE            NULL                         COMMENT '(INID 22) Ngày nộp đơn',

    -- --- Thông tin công bố ---
    publication_number  VARCHAR(100)    NULL                         COMMENT '(INID 11) Số công bố',
    publication_date    DATE            NULL                         COMMENT '(INID 43) Ngày công bố đơn',

    -- --- Thông tin cấp bằng ---
    grant_number        VARCHAR(100)    NULL                         COMMENT '(INID 11) Số bằng/GCN',
    grant_date          DATE            NULL                         COMMENT '(INID 45) Ngày cấp bằng',

    -- --- Ngày hết hạn (tính toán) ---
    expiry_date         DATE            NULL                         COMMENT 'Ngày hết hạn hiệu lực',

    -- --- Trạng thái pháp lý ---
    status_code         VARCHAR(50)     NOT NULL DEFAULT 'pending_formal'
                                                                     COMMENT 'FK → ref_status',

    -- --- Chủ đơn / Chủ bằng ---
    -- Một đối tượng SHTT có thể do cá nhân HOẶC tổ chức làm chủ
    -- Dùng polymorphic: lưu type + id
    owner_type          ENUM('person','organization') NULL           COMMENT 'Loại chủ sở hữu',
    owner_person_id     CHAR(36)        NULL                         COMMENT 'FK → persons (nếu owner_type=person)',
    owner_org_id        CHAR(36)        NULL                         COMMENT 'FK → organizations (nếu owner_type=organization)',
    owner_address       TEXT            NULL                         COMMENT 'Địa chỉ chủ đơn (lưu lại tại thời điểm đăng ký)',

    -- --- Địa bàn Bắc Ninh (đặc thù địa phương) ---
    province_code       VARCHAR(10)     NULL DEFAULT 'BN'            COMMENT 'Tỉnh của chủ đơn',
    district_code       VARCHAR(10)     NULL                         COMMENT 'Huyện của chủ đơn',

    -- --- Ghi chú nội bộ ---
    internal_notes      TEXT            NULL                         COMMENT 'Ghi chú nội bộ (không hiển thị public)',

    -- --- Audit columns ---
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          CHAR(36)        NULL                         COMMENT 'FK → users.id',
    updated_by          CHAR(36)        NULL                         COMMENT 'FK → users.id',
    deleted_at          DATETIME        NULL                         COMMENT 'Soft delete',

    PRIMARY KEY (id),

    -- Unique: Số đơn phải duy nhất trong cùng loại đối tượng
    UNIQUE KEY uq_asset_app_number (application_number, asset_type),

    -- Indexes cho tìm kiếm phổ biến
    KEY idx_asset_type          (asset_type),
    KEY idx_asset_status        (status_code),
    KEY idx_asset_type_status   (asset_type, status_code, deleted_at),
    KEY idx_asset_app_date      (application_date DESC),
    KEY idx_asset_grant_date    (grant_date DESC),
    KEY idx_asset_expiry        (expiry_date),
    KEY idx_asset_province      (province_code),
    KEY idx_asset_district      (district_code),
    KEY idx_asset_owner_person  (owner_person_id),
    KEY idx_asset_owner_org     (owner_org_id),
    KEY idx_asset_title         (title(200)),
    KEY idx_asset_created_by    (created_by),

    CONSTRAINT fk_asset_status
        FOREIGN KEY (status_code) REFERENCES ref_status(code),
    CONSTRAINT fk_asset_owner_person
        FOREIGN KEY (owner_person_id) REFERENCES persons(id),
    CONSTRAINT fk_asset_owner_org
        FOREIGN KEY (owner_org_id) REFERENCES organizations(id),
    CONSTRAINT fk_asset_province
        FOREIGN KEY (province_code) REFERENCES ref_provinces(code),
    CONSTRAINT fk_asset_district
        FOREIGN KEY (district_code) REFERENCES ref_districts(code),
    CONSTRAINT fk_asset_created_by
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_asset_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng lõi chung cho tất cả đối tượng SHTT (Table-per-Type base)';


-- =============================================================================
-- PHẦN 5: BẢNG ĐẶC THÙ TỪNG LOẠI ĐỐI TƯỢNG SHTT
-- Mỗi bảng có quan hệ 1-1 với ip_assets qua asset_id
-- =============================================================================

-- 5.1. Bản quyền tác giả (copyright_details)
CREATE TABLE copyright_details (
    asset_id            CHAR(36)        NOT NULL    COMMENT 'PK & FK → ip_assets.id (1-1)',

    -- Số giấy chứng nhận (với bản quyền, đây là grant_number trong ip_assets)
    -- Tên tác phẩm = ip_assets.title
    -- Ngày cấp = ip_assets.grant_date

    work_type_code      VARCHAR(50)     NOT NULL    COMMENT 'Loại hình tác phẩm, FK → ref_copyright_work_types',
    work_sample_url     VARCHAR(1000)   NULL        COMMENT 'Link file mẫu tác phẩm (ảnh, PDF...) trên Object Storage',
    work_sample_note    VARCHAR(500)    NULL        COMMENT 'Ghi chú về file mẫu (giới hạn hiển thị công khai)',

    -- Tác giả (1 bản quyền có thể có nhiều tác giả → bảng liên kết riêng)
    -- Xem bảng copyright_authors

    -- Chủ sở hữu (nằm ở ip_assets: owner_type/owner_person_id/owner_org_id)

    PRIMARY KEY (asset_id),
    CONSTRAINT fk_copyright_asset
        FOREIGN KEY (asset_id) REFERENCES ip_assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_copyright_work_type
        FOREIGN KEY (work_type_code) REFERENCES ref_copyright_work_types(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Chi tiết đặc thù của Bản quyền tác giả';


-- 5.1.1. Tác giả của bản quyền (quan hệ nhiều-nhiều với persons)
CREATE TABLE copyright_authors (
    asset_id        CHAR(36)        NOT NULL    COMMENT 'FK → copyright_details.asset_id',
    person_id       CHAR(36)        NOT NULL    COMMENT 'FK → persons.id',
    sort_order      TINYINT         NOT NULL DEFAULT 1 COMMENT 'Thứ tự tác giả',

    PRIMARY KEY (asset_id, person_id),
    KEY idx_ca_person (person_id),
    CONSTRAINT fk_ca_asset
        FOREIGN KEY (asset_id) REFERENCES copyright_details(asset_id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_person
        FOREIGN KEY (person_id) REFERENCES persons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng liên kết Tác giả của Bản quyền (nhiều-nhiều)';


-- 5.2. Chỉ dẫn địa lý (gi_details)
CREATE TABLE gi_details (
    asset_id            CHAR(36)        NOT NULL    COMMENT 'PK & FK → ip_assets.id',

    -- Tên CDĐL = ip_assets.title
    -- Số đơn = ip_assets.application_number
    -- Ngày nộp = ip_assets.application_date
    -- Số GCN = ip_assets.grant_number
    -- Ngày cấp = ip_assets.grant_date
    -- Chủ đơn = ip_assets.owner_*

    product_name        VARCHAR(500)    NOT NULL    COMMENT 'Tên sản phẩm mang CDĐL',
    geographic_area     TEXT            NOT NULL    COMMENT 'Mô tả khu vực địa lý',

    -- Tổ chức quản lý CDĐL (khác với chủ đơn)
    managing_org_id     CHAR(36)        NULL        COMMENT 'FK → organizations.id',
    managing_org_address TEXT           NULL        COMMENT 'Địa chỉ tổ chức quản lý CDĐL',

    description_url     VARCHAR(1000)   NULL        COMMENT 'Link file bản mô tả (PDF) trên Object Storage',
    description_note    TEXT            NULL        COMMENT 'Tóm tắt bản mô tả',

    PRIMARY KEY (asset_id),
    CONSTRAINT fk_gi_asset
        FOREIGN KEY (asset_id) REFERENCES ip_assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_gi_managing_org
        FOREIGN KEY (managing_org_id) REFERENCES organizations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Chi tiết đặc thù của Chỉ dẫn địa lý (GI)';


-- 5.3. Nhãn hiệu (trademark_details)
CREATE TABLE trademark_details (
    asset_id            CHAR(36)        NOT NULL    COMMENT 'PK & FK → ip_assets.id',

    -- Tên nhãn hiệu = ip_assets.title
    -- Số đơn = ip_assets.application_number
    -- Ngày nộp = ip_assets.application_date
    -- Số công bố = ip_assets.publication_number
    -- Ngày công bố = ip_assets.publication_date
    -- Số bằng = ip_assets.grant_number
    -- Ngày cấp = ip_assets.grant_date
    -- Ngày hết hạn = ip_assets.expiry_date (grant_date + 10 năm)
    -- Chủ đơn = ip_assets.owner_*

    application_type    ENUM('normal','collective','certification')
                                        NOT NULL DEFAULT 'normal'
                                                    COMMENT 'Loại nhãn hiệu: thông thường/tập thể/chứng nhận',

    logo_image_url      VARCHAR(1000)   NULL        COMMENT 'URL ảnh mẫu nhãn hiệu chính',

    -- Nhóm Nice và mã Vienna lưu trong bảng liên kết asset_classifications
    -- Xem: asset_nice_classes và asset_vienna_codes

    color_claim         VARCHAR(500)    NULL        COMMENT 'Yêu cầu màu sắc (nếu có)',
    transliteration     VARCHAR(500)    NULL        COMMENT 'Phiên âm (nếu là chữ nước ngoài)',
    translation         VARCHAR(500)    NULL        COMMENT 'Dịch nghĩa (nếu có)',
    disclaimer          TEXT            NULL        COMMENT 'Tuyên bố không độc quyền thành phần',

    PRIMARY KEY (asset_id),
    CONSTRAINT fk_trademark_asset
        FOREIGN KEY (asset_id) REFERENCES ip_assets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Chi tiết đặc thù của Nhãn hiệu';


-- 5.3.1. Nhóm Nice của nhãn hiệu (nhiều-nhiều)
CREATE TABLE trademark_nice_classes (
    asset_id        CHAR(36)            NOT NULL    COMMENT 'FK → trademark_details.asset_id',
    class_no        TINYINT UNSIGNED    NOT NULL    COMMENT 'FK → ref_nice_classification.class_no',
    goods_services_detail
                    TEXT                NULL        COMMENT 'Danh mục hàng hóa/dịch vụ cụ thể trong nhóm',

    PRIMARY KEY (asset_id, class_no),
    CONSTRAINT fk_tnc_asset
        FOREIGN KEY (asset_id) REFERENCES trademark_details(asset_id) ON DELETE CASCADE,
    CONSTRAINT fk_tnc_nice
        FOREIGN KEY (class_no) REFERENCES ref_nice_classification(class_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nhóm Nice của nhãn hiệu (nhiều-nhiều)';


-- 5.3.2. Mã Vienna của nhãn hiệu (nhiều-nhiều)
CREATE TABLE trademark_vienna_codes (
    asset_id        CHAR(36)        NOT NULL    COMMENT 'FK → trademark_details.asset_id',
    vienna_code     VARCHAR(20)     NOT NULL    COMMENT 'FK → ref_vienna_classification.code',

    PRIMARY KEY (asset_id, vienna_code),
    CONSTRAINT fk_tvc_asset
        FOREIGN KEY (asset_id) REFERENCES trademark_details(asset_id) ON DELETE CASCADE,
    CONSTRAINT fk_tvc_vienna
        FOREIGN KEY (vienna_code) REFERENCES ref_vienna_classification(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mã Vienna (phân loại hình) của nhãn hiệu';


-- 5.4. Sáng chế / Giải pháp hữu ích (patent_details)
CREATE TABLE patent_details (
    asset_id            CHAR(36)        NOT NULL    COMMENT 'PK & FK → ip_assets.id',

    -- Tên sáng chế = ip_assets.title
    -- Số đơn = ip_assets.application_number
    -- ...
    -- Chủ đơn = ip_assets.owner_*

    patent_type         ENUM('patent','utility_solution')
                                        NOT NULL DEFAULT 'patent'
                                                    COMMENT 'Loại: Sáng chế hoặc Giải pháp hữu ích',
    abstract_text       TEXT            NULL        COMMENT 'Tóm tắt sáng chế',
    claim_count         TINYINT         NULL        COMMENT 'Số lượng điểm yêu cầu bảo hộ',
    priority_date       DATE            NULL        COMMENT 'Ngày ưu tiên (Paris Convention)',
    priority_country    VARCHAR(10)     NULL        COMMENT 'Quốc gia ưu tiên (ISO 3166)',
    priority_number     VARCHAR(100)    NULL        COMMENT 'Số đơn ưu tiên',

    -- IPC codes lưu trong bảng liên kết patent_ipc_codes

    PRIMARY KEY (asset_id),
    CONSTRAINT fk_patent_asset
        FOREIGN KEY (asset_id) REFERENCES ip_assets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Chi tiết đặc thù của Sáng chế / Giải pháp hữu ích';


-- 5.4.1. Tác giả sáng chế / Nhà sáng chế (nhiều-nhiều)
CREATE TABLE patent_inventors (
    asset_id        CHAR(36)        NOT NULL    COMMENT 'FK → patent_details.asset_id',
    person_id       CHAR(36)        NOT NULL    COMMENT 'FK → persons.id',
    sort_order      TINYINT         NOT NULL DEFAULT 1,

    PRIMARY KEY (asset_id, person_id),
    KEY idx_pi_person (person_id),
    CONSTRAINT fk_pi_asset
        FOREIGN KEY (asset_id) REFERENCES patent_details(asset_id) ON DELETE CASCADE,
    CONSTRAINT fk_pi_person
        FOREIGN KEY (person_id) REFERENCES persons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nhà sáng chế / Tác giả sáng chế (nhiều-nhiều)';


-- 5.4.2. Mã IPC của sáng chế (nhiều-nhiều)
CREATE TABLE patent_ipc_codes (
    asset_id        CHAR(36)        NOT NULL    COMMENT 'FK → patent_details.asset_id',
    ipc_code        VARCHAR(20)     NOT NULL    COMMENT 'FK → ref_ipc_classification.code',
    is_main         TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Phân loại chính (main IPC)',

    PRIMARY KEY (asset_id, ipc_code),
    CONSTRAINT fk_pic_asset
        FOREIGN KEY (asset_id) REFERENCES patent_details(asset_id) ON DELETE CASCADE,
    CONSTRAINT fk_pic_ipc
        FOREIGN KEY (ipc_code) REFERENCES ref_ipc_classification(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mã IPC của sáng chế (nhiều-nhiều)';


-- 5.5. Kiểu dáng công nghiệp (design_details)
CREATE TABLE design_details (
    asset_id            CHAR(36)        NOT NULL    COMMENT 'PK & FK → ip_assets.id',

    -- Tên KDCN = ip_assets.title
    -- Số đơn = ip_assets.application_number
    -- Ngày hết hạn = ip_assets.expiry_date
    --   Công thức: grant_date + 5 năm; gia hạn tối đa 2 lần → tối đa 15 năm

    -- Locarno codes lưu trong bảng liên kết design_locarno_codes
    -- Images lưu trong bảng asset_images (để dùng chung)

    renewal_count       TINYINT         NOT NULL DEFAULT 0
                                                    COMMENT 'Số lần đã gia hạn (tối đa 2)',
    priority_date       DATE            NULL        COMMENT 'Ngày ưu tiên',
    priority_country    VARCHAR(10)     NULL        COMMENT 'Quốc gia ưu tiên',
    priority_number     VARCHAR(100)    NULL        COMMENT 'Số đơn ưu tiên',

    PRIMARY KEY (asset_id),
    CONSTRAINT fk_design_asset
        FOREIGN KEY (asset_id) REFERENCES ip_assets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Chi tiết đặc thù của Kiểu dáng công nghiệp';


-- 5.5.1. Tác giả kiểu dáng (nhiều-nhiều)
CREATE TABLE design_creators (
    asset_id        CHAR(36)        NOT NULL    COMMENT 'FK → design_details.asset_id',
    person_id       CHAR(36)        NOT NULL    COMMENT 'FK → persons.id',
    sort_order      TINYINT         NOT NULL DEFAULT 1,

    PRIMARY KEY (asset_id, person_id),
    KEY idx_dc_person (person_id),
    CONSTRAINT fk_dc_asset
        FOREIGN KEY (asset_id) REFERENCES design_details(asset_id) ON DELETE CASCADE,
    CONSTRAINT fk_dc_person
        FOREIGN KEY (person_id) REFERENCES persons(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tác giả của kiểu dáng công nghiệp (nhiều-nhiều)';


-- 5.5.2. Mã Locarno của kiểu dáng (nhiều-nhiều)
CREATE TABLE design_locarno_codes (
    asset_id        CHAR(36)        NOT NULL    COMMENT 'FK → design_details.asset_id',
    locarno_code    VARCHAR(10)     NOT NULL    COMMENT 'FK → ref_locarno_classification.code',
    is_main         TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Phân loại chính',

    PRIMARY KEY (asset_id, locarno_code),
    CONSTRAINT fk_dlc_asset
        FOREIGN KEY (asset_id) REFERENCES design_details(asset_id) ON DELETE CASCADE,
    CONSTRAINT fk_dlc_locarno
        FOREIGN KEY (locarno_code) REFERENCES ref_locarno_classification(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mã Locarno của kiểu dáng công nghiệp (nhiều-nhiều)';


-- =============================================================================
-- PHẦN 6: BẢNG HÌNH ẢNH & FILE ĐÍNH KÈM CHUNG
-- Dùng chung cho tất cả đối tượng SHTT (đặc biệt nhãn hiệu và kiểu dáng)
-- =============================================================================

CREATE TABLE asset_images (
    id              CHAR(36)        NOT NULL DEFAULT (UUID()),
    asset_id        CHAR(36)        NOT NULL    COMMENT 'FK → ip_assets.id',
    image_url       VARCHAR(1000)   NOT NULL    COMMENT 'URL đầy đủ trên Object Storage (MinIO/S3)',
    image_type      ENUM('logo','main','front','back','top','bottom','side_left','side_right',
                         'perspective','cross_section','detail','other')
                                    NOT NULL DEFAULT 'main' COMMENT 'Loại ảnh / góc chiếu',
    file_name       VARCHAR(500)    NULL        COMMENT 'Tên file gốc',
    file_size_kb    INT             NULL        COMMENT 'Kích thước file (KB)',
    mime_type       VARCHAR(50)     NULL        COMMENT 'MIME type (image/jpeg, image/png...)',
    width_px        INT             NULL        COMMENT 'Chiều rộng (pixel)',
    height_px       INT             NULL        COMMENT 'Chiều cao (pixel)',
    sort_order      TINYINT         NOT NULL DEFAULT 1 COMMENT 'Thứ tự hiển thị',
    caption         VARCHAR(500)    NULL        COMMENT 'Chú thích ảnh',
    is_primary      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Ảnh đại diện chính',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    uploaded_by     CHAR(36)        NULL        COMMENT 'FK → users.id',

    PRIMARY KEY (id),
    KEY idx_ai_asset (asset_id),
    KEY idx_ai_primary (asset_id, is_primary),
    CONSTRAINT fk_ai_asset
        FOREIGN KEY (asset_id) REFERENCES ip_assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_uploader
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Hình ảnh đính kèm cho các đối tượng SHTT (nhãn hiệu, kiểu dáng, bản quyền...)';


-- =============================================================================
-- PHẦN 7: LÀNG NGHỀ (Module đặc thù địa phương Bắc Ninh)
-- Là reference data, có quan hệ nhiều-nhiều với ip_assets
-- =============================================================================

CREATE TABLE craft_villages (
    id                  CHAR(36)        NOT NULL DEFAULT (UUID()),
    village_name        VARCHAR(255)    NOT NULL    COMMENT 'Tên làng nghề',
    products            TEXT            NULL        COMMENT 'Sản phẩm chính của làng nghề (mô tả)',
    address             TEXT            NULL        COMMENT 'Địa chỉ đầy đủ',
    district_code       VARCHAR(10)     NULL        COMMENT 'FK → ref_districts',
    province_code       VARCHAR(10)     NOT NULL DEFAULT 'BN' COMMENT 'FK → ref_provinces',
    recognition_number  VARCHAR(100)    NULL        COMMENT 'Số bằng công nhận làng nghề',
    recognition_date    DATE            NULL        COMMENT 'Ngày công nhận',
    recognition_agency  VARCHAR(500)    NULL        COMMENT 'Cơ quan công nhận',
    description         TEXT            NULL        COMMENT 'Lịch sử, đặc trưng làng nghề',
    representative_image_url
                        VARCHAR(1000)   NULL        COMMENT 'Ảnh đại diện làng nghề',
    website             VARCHAR(500)    NULL,
    contact_phone       VARCHAR(20)     NULL,
    is_active           TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at          DATETIME        NULL,

    PRIMARY KEY (id),
    KEY idx_cv_district (district_code),
    KEY idx_cv_name (village_name),
    CONSTRAINT fk_cv_district
        FOREIGN KEY (district_code) REFERENCES ref_districts(code),
    CONSTRAINT fk_cv_province
        FOREIGN KEY (province_code) REFERENCES ref_provinces(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Làng nghề truyền thống Bắc Ninh (module đặc thù địa phương)';


-- Dữ liệu mẫu làng nghề tiêu biểu Bắc Ninh
INSERT INTO craft_villages (id, village_name, products, district_code, province_code, description) VALUES
(UUID(), 'Làng gốm Phù Lãng',      'Gốm sứ truyền thống',      'BN-QV',    'BN', 'Làng nghề gốm nổi tiếng với kỹ thuật tráng men truyền thống'),
(UUID(), 'Làng tranh Đông Hồ',     'Tranh dân gian Đông Hồ',   'BN-TH',    'BN', 'Di sản văn hóa phi vật thể quốc gia về tranh dân gian'),
(UUID(), 'Làng đúc đồng Đại Bái',  'Đồ đồng mỹ nghệ',         'BN-GD',    'BN', 'Làng nghề đúc đồng lâu đời nhất miền Bắc'),
(UUID(), 'Làng giấy Dương Ổ',      'Giấy dó, giấy thủ công',  'BN-TP',    'BN', 'Làng nghề sản xuất giấy dó truyền thống'),
(UUID(), 'Làng khắc gỗ Phù Khê',   'Đồ gỗ mỹ nghệ',           'BN-TT',    'BN', 'Làng nghề chuyên khắc gỗ và sản xuất đồ gỗ mỹ nghệ');


-- 7.1. Quan hệ nhiều-nhiều: ip_assets ↔ craft_villages
CREATE TABLE asset_craft_villages (
    asset_id        CHAR(36)        NOT NULL    COMMENT 'FK → ip_assets.id',
    village_id      CHAR(36)        NOT NULL    COMMENT 'FK → craft_villages.id',
    relation_note   VARCHAR(500)    NULL        COMMENT 'Ghi chú mối quan hệ',

    PRIMARY KEY (asset_id, village_id),
    KEY idx_acv_village (village_id),
    CONSTRAINT fk_acv_asset
        FOREIGN KEY (asset_id) REFERENCES ip_assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_acv_village
        FOREIGN KEY (village_id) REFERENCES craft_villages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Bảng liên kết: Đối tượng SHTT - Làng nghề (nhiều-nhiều)';


-- =============================================================================
-- PHẦN 8: FULL-TEXT SEARCH INDEX (MySQL FULLTEXT)
-- Dùng cho tìm kiếm cơ bản trước khi deploy Elasticsearch
-- =============================================================================

-- Bổ sung FULLTEXT index cho tìm kiếm từ khóa tiếng Việt
ALTER TABLE ip_assets
    ADD FULLTEXT INDEX ft_asset_title (title);

ALTER TABLE organizations
    ADD FULLTEXT INDEX ft_org_name (org_name, org_name_en);

ALTER TABLE persons
    ADD FULLTEXT INDEX ft_person_name (full_name, full_name_en);

ALTER TABLE craft_villages
    ADD FULLTEXT INDEX ft_village (village_name, products, description);


-- =============================================================================
-- PHẦN 9: VIEWS HỖ TRỢ TRUY VẤN
-- Giúp backend/DBA truy vấn thuận tiện hơn
-- =============================================================================

-- View tổng hợp thông tin cơ bản một đối tượng SHTT (dùng cho public portal)
CREATE OR REPLACE VIEW v_ip_assets_summary AS
SELECT
    a.id,
    a.asset_type,
    a.title,
    a.application_number,
    a.application_date,
    a.publication_number,
    a.publication_date,
    a.grant_number,
    a.grant_date,
    a.expiry_date,
    a.status_code,
    st.name_vi                          AS status_name,
    a.owner_type,
    CASE
        WHEN a.owner_type = 'person'        THEN p.full_name
        WHEN a.owner_type = 'organization'  THEN o.org_name
    END                                 AS owner_name,
    CASE
        WHEN a.owner_type = 'person'        THEN p.address
        WHEN a.owner_type = 'organization'  THEN o.address
    END                                 AS owner_address,
    a.province_code,
    a.district_code,
    d.name                              AS district_name,
    a.created_at,
    a.deleted_at
FROM ip_assets a
LEFT JOIN ref_status        st  ON a.status_code        = st.code
LEFT JOIN persons           p   ON a.owner_person_id    = p.id
LEFT JOIN organizations     o   ON a.owner_org_id       = o.id
LEFT JOIN ref_districts     d   ON a.district_code      = d.code;


-- View thống kê số lượng bản ghi theo loại và trạng thái
CREATE OR REPLACE VIEW v_asset_statistics AS
SELECT
    asset_type,
    status_code,
    COUNT(*)                AS total_count,
    MIN(application_date)   AS earliest_app_date,
    MAX(application_date)   AS latest_app_date
FROM ip_assets
WHERE deleted_at IS NULL
GROUP BY asset_type, status_code;


-- View cảnh báo bản ghi sắp hết hạn (trong 90 ngày tới)
CREATE OR REPLACE VIEW v_expiring_assets AS
SELECT
    a.id,
    a.asset_type,
    a.title,
    a.grant_number,
    a.expiry_date,
    DATEDIFF(a.expiry_date, CURDATE()) AS days_until_expiry,
    CASE
        WHEN a.owner_type = 'person'        THEN p.full_name
        WHEN a.owner_type = 'organization'  THEN o.org_name
    END AS owner_name
FROM ip_assets a
LEFT JOIN persons       p   ON a.owner_person_id    = p.id
LEFT JOIN organizations o   ON a.owner_org_id       = o.id
WHERE a.deleted_at IS NULL
  AND a.expiry_date IS NOT NULL
  AND a.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
ORDER BY a.expiry_date ASC;


-- =============================================================================
-- PHẦN 10: STORED PROCEDURES TIỆN ÍCH
-- =============================================================================

DELIMITER $$

-- Procedure: Tự động tính ngày hết hạn khi cấp bằng
CREATE PROCEDURE sp_calculate_expiry_date(
    IN p_asset_id   CHAR(36),
    IN p_grant_date DATE
)
BEGIN
    DECLARE v_asset_type VARCHAR(50);
    DECLARE v_expiry_date DATE;

    SELECT asset_type INTO v_asset_type
    FROM ip_assets WHERE id = p_asset_id;

    -- Công thức theo Luật SHTT Việt Nam:
    -- Nhãn hiệu: 10 năm kể từ ngày nộp đơn (gia hạn vô thời hạn từng 10 năm)
    -- Kiểu dáng: 5 năm kể từ ngày nộp đơn (gia hạn tối đa 2 lần, tối đa 15 năm)
    -- Sáng chế: 20 năm kể từ ngày nộp đơn (không gia hạn)
    -- GPHI: 10 năm kể từ ngày nộp đơn (không gia hạn)

    SET v_expiry_date = CASE v_asset_type
        WHEN 'trademark'    THEN DATE_ADD(p_grant_date, INTERVAL 10 YEAR)
        WHEN 'design'       THEN DATE_ADD(p_grant_date, INTERVAL 5 YEAR)
        WHEN 'patent'       THEN DATE_ADD((SELECT application_date FROM ip_assets WHERE id = p_asset_id), INTERVAL 20 YEAR)
        ELSE NULL
    END;

    UPDATE ip_assets
    SET expiry_date = v_expiry_date,
        updated_at  = NOW()
    WHERE id = p_asset_id;

    SELECT v_expiry_date AS calculated_expiry_date;
END$$


-- Procedure: Tìm kiếm cơ bản (dùng trước khi có Elasticsearch)
CREATE PROCEDURE sp_search_assets(
    IN p_keyword    VARCHAR(500),
    IN p_asset_type VARCHAR(50),       -- NULL = tất cả loại
    IN p_status     VARCHAR(50),       -- NULL = tất cả trạng thái
    IN p_province   VARCHAR(10),       -- NULL = tất cả tỉnh
    IN p_page       INT,               -- bắt đầu từ 1
    IN p_page_size  INT                -- số bản ghi mỗi trang
)
BEGIN
    DECLARE v_offset INT DEFAULT 0;
    SET v_offset = (p_page - 1) * p_page_size;

    SELECT
        a.id,
        a.asset_type,
        a.title,
        a.application_number,
        a.application_date,
        a.grant_number,
        a.grant_date,
        a.expiry_date,
        a.status_code,
        st.name_vi AS status_name,
        CASE
            WHEN a.owner_type = 'person'        THEN p2.full_name
            WHEN a.owner_type = 'organization'  THEN o.org_name
        END AS owner_name
    FROM ip_assets a
    LEFT JOIN ref_status     st  ON a.status_code     = st.code
    LEFT JOIN persons        p2  ON a.owner_person_id = p2.id
    LEFT JOIN organizations  o   ON a.owner_org_id    = o.id
    WHERE a.deleted_at IS NULL
      AND (p_keyword IS NULL OR p_keyword = '' OR (
              a.title LIKE CONCAT('%', p_keyword, '%')
           OR a.application_number LIKE CONCAT('%', p_keyword, '%')
           OR a.grant_number LIKE CONCAT('%', p_keyword, '%')
           OR p2.full_name LIKE CONCAT('%', p_keyword, '%')
           OR o.org_name LIKE CONCAT('%', p_keyword, '%')
          ))
      AND (p_asset_type IS NULL OR p_asset_type = '' OR a.asset_type = p_asset_type)
      AND (p_status IS NULL OR p_status = '' OR a.status_code = p_status)
      AND (p_province IS NULL OR p_province = '' OR a.province_code = p_province)
    ORDER BY a.application_date DESC
    LIMIT p_page_size OFFSET v_offset;
END$$

DELIMITER ;


-- =============================================================================
-- PHẦN 11: BẬT LẠI FOREIGN KEY CHECK
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 1;


-- =============================================================================
-- TÓM TẮT CẤU TRÚC DATABASE
-- =============================================================================
/*
DANH SÁCH BẢNG CHÍNH (17 bảng + 2 views):

[AUTH]
  1. users                     - Người dùng hệ thống (admin/staff)

[REFERENCE]
  2. ref_provinces             - Tỉnh/thành phố
  3. ref_districts             - Huyện/quận
  4. ref_status                - Trạng thái hồ sơ
  5. ref_copyright_work_types  - Loại hình tác phẩm bản quyền
  6. ref_nice_classification   - Phân loại Nice (nhãn hiệu - 45 nhóm)
  7. ref_vienna_classification - Phân loại Vienna (nhãn hiệu - yếu tố hình)
  8. ref_ipc_classification    - Phân loại IPC (sáng chế)
  9. ref_locarno_classification- Phân loại Locarno (kiểu dáng - 32 nhóm)

[ENTITY]
  10. organizations            - Tổ chức/Doanh nghiệp
  11. persons                  - Cá nhân (tác giả, chủ đơn)

[CORE]
  12. ip_assets                - Bảng lõi chung (base table, Table-per-Type)

[DETAIL - 1-1 với ip_assets]
  13. copyright_details        - Chi tiết Bản quyền tác giả
  14. gi_details               - Chi tiết Chỉ dẫn địa lý
  15. trademark_details        - Chi tiết Nhãn hiệu
  16. patent_details           - Chi tiết Sáng chế/GPHI
  17. design_details           - Chi tiết Kiểu dáng công nghiệp

[JUNCTION - nhiều-nhiều]
  18. copyright_authors        - Tác giả bản quyền
  19. trademark_nice_classes   - Nhóm Nice của nhãn hiệu
  20. trademark_vienna_codes   - Mã Vienna của nhãn hiệu
  21. patent_inventors         - Nhà sáng chế
  22. patent_ipc_codes         - Mã IPC của sáng chế
  23. design_creators          - Tác giả kiểu dáng
  24. design_locarno_codes     - Mã Locarno của kiểu dáng
  25. asset_craft_villages     - Liên kết SHTT ↔ Làng nghề

[MEDIA]
  26. asset_images             - Hình ảnh đính kèm (nhãn hiệu, kiểu dáng...)

[LOCAL MODULE]
  27. craft_villages           - Làng nghề (đặc thù Bắc Ninh)

[VIEWS]
  V1. v_ip_assets_summary      - View tổng hợp cho public portal
  V2. v_asset_statistics       - Thống kê theo loại/trạng thái
  V3. v_expiring_assets        - Cảnh báo bản ghi sắp hết hạn (90 ngày)

[STORED PROCEDURES]
  SP1. sp_calculate_expiry_date - Tính ngày hết hạn theo Luật SHTT VN
  SP2. sp_search_assets         - Tìm kiếm cơ bản (fallback khi chưa có ES)

Yêu cầu MySQL: 8.0+ (cần hỗ trợ DEFAULT (UUID()) và FULLTEXT cho utf8mb4)
*/