import 'dotenv/config';
import mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function runSeed() {
  console.log('🌱 Đang khởi tạo kết nối database...');
  
  const dbConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    console.log('✅ Kết nối thành công. Bắt đầu seed dữ liệu...');

    // 1. Tạo mật khẩu băm chung cho các user test
    const rawPassword = process.env.SEED_DEFAULT_PASSWORD || 'Test@123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

    // 2. Seed Users (Admin & Staff)
    const adminId = crypto.randomUUID();
    const staffId = crypto.randomUUID();

    console.log('👤 Đang thêm dữ liệu Users...');
    await dbConnection.query(
      `INSERT INTO users (id, username, email, password_hash, full_name, role) VALUES 
      (?, ?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?, ?)`,
      [
        adminId, 'admin', 'admin@bacninh.gov.vn', hashedPassword, 'Quản trị viên', 'admin',
        staffId, 'staff', 'staff@bacninh.gov.vn', hashedPassword, 'Chuyên viên SHTT', 'staff'
      ]
    );

    // 3. Seed Organizations (Tổ chức)
    const orgId = crypto.randomUUID();
    console.log('🏢 Đang thêm dữ liệu Tổ chức...');
    await dbConnection.query(
      `INSERT INTO organizations (id, org_name, org_type, tax_code, address, province_code, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orgId, 'Công ty TNHH Bánh Phu Thê Đình Bảng', 'company', '0123456789', 'Đình Bảng, Từ Sơn', 'BN', adminId]
    );

    // 4. Seed Persons (Cá nhân)
    const personId = crypto.randomUUID();
    console.log('🧑 Đang thêm dữ liệu Cá nhân...');
    await dbConnection.query(
      `INSERT INTO persons (id, full_name, id_number, address, province_code, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [personId, 'Nguyễn Văn Test', '027099000123', 'Phường Suối Hoa, TP Bắc Ninh', 'BN', adminId]
    );

    // 5. Seed IP Asset (Tài sản SHTT: 1 Nhãn hiệu)
    const assetId = crypto.randomUUID();
    console.log('📜 Đang thêm dữ liệu Đối tượng SHTT (Nhãn hiệu)...');
    
    // Thêm vào bảng cha (ip_assets)
    await dbConnection.query(
      `INSERT INTO ip_assets (
        id, asset_type, title, application_number, application_date, 
        status, applicant_org_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assetId, 'trademark', 'Bánh Phu Thê truyền thống', '4-2026-12345', '2026-04-20',
        'published', orgId, adminId
      ]
    );

    // Thêm vào bảng con (trademark_details)
    // Cập nhật lại các trường cho khớp với Entity (sử dụng application_type, is_colored, goods_services_description)
    await dbConnection.query(
      `INSERT INTO trademark_details (asset_id, application_type, is_colored, goods_services_description) 
       VALUES (?, ?, ?, ?)`,
      [assetId, 'individual', 1, 'Bánh phu thê, bánh xu xê truyền thống']
    );

    console.log('🎉 Đã seed dữ liệu thành công!');
    console.log(`🔑 Tài khoản test: admin / ${rawPassword} | staff / ${rawPassword}`);

  } catch (error) {
    console.error('❌ Lỗi trong quá trình seed dữ liệu:', error);
  } finally {
    // Đóng kết nối DB
    await dbConnection.end();
    console.log('🔌 Đã đóng kết nối database.');
  }
}

// Thực thi hàm
runSeed();