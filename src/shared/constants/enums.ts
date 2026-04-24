/**
 * Các enum dùng chung toàn hệ thống
 * Khớp với ENUM values trong schema.sql
 */

export enum AssetType {
  COPYRIGHT = 'copyright',
  GI = 'gi',
  TRADEMARK = 'trademark',
  PATENT = 'patent',
  DESIGN = 'design',
  CRAFT = 'craft',
}

export enum AssetStatus {
  DRAFT = 'draft',                           // Bản nháp
  PENDING_FORMAL = 'pending_formal',         // Đang thẩm định hình thức
  PUBLISHED = 'published',                   // Đã công bố hợp lệ
  PENDING_SUBSTANTIVE = 'pending_substantive', // Đang thẩm định nội dung
  GRANTED = 'granted',                       // Đã cấp bằng/GCN
  REFUSED = 'refused',                       // Bị từ chối
  WITHDRAWN = 'withdrawn',                   // Rút đơn
  LAPSED = 'lapsed',                         // Hết hiệu lực
}

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  SOFT_DELETE = 'SOFT_DELETE',
  HARD_DELETE = 'HARD_DELETE',
  RESTORE = 'RESTORE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum TrademarkApplicationType {
  INDIVIDUAL = 'individual',
  COLLECTIVE = 'collective',
  CERTIFICATION = 'certification',
}

export enum CopyrightWorkType {
  LITERARY = 'literary',
  MUSICAL = 'musical',
  DRAMATIC = 'dramatic',
  ARTISTIC = 'artistic',
  CINEMATOGRAPHIC = 'cinematographic',
  SOFTWARE = 'software',
  OTHER = 'other',
}

export enum PatentType {
  INVENTION = 'invention',       // Sáng chế
  UTILITY = 'utility',           // Giải pháp hữu ích
}