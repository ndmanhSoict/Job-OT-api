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
  PENDING = 'pending',             // Đang thẩm định
  PUBLISHED = 'published',         // Đã công bố
  GRANTED = 'granted',             // Đã cấp bằng
  REFUSED = 'refused',             // Bị từ chối
  WITHDRAWN = 'withdrawn',         // Rút đơn
  EXPIRED = 'expired',             // Hết hiệu lực
  LAPSED = 'lapsed',               // Không gia hạn
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