import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

// ---------------------------------------------------------------------------
// 4.1 POST /auth/login
// ---------------------------------------------------------------------------
export class LoginDto {
  /** Username hoặc email; không rỗng; max 255 ký tự */
  @IsString()
  @IsNotEmpty({ message: 'identifier không được để trống' })
  @MaxLength(255, { message: 'identifier tối đa 255 ký tự' })
  identifier: string;

  /** Không rỗng; min 8 ký tự */
  @IsString()
  @IsNotEmpty({ message: 'password không được để trống' })
  @MinLength(8, { message: 'password tối thiểu 8 ký tự' })
  password: string;
}

// ---------------------------------------------------------------------------
// 4.2 POST /auth/refresh
// ---------------------------------------------------------------------------
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'refresh_token không được để trống' })
  refresh_token: string;
}

// ---------------------------------------------------------------------------
// 4.3 POST /auth/logout
// ---------------------------------------------------------------------------
export class LogoutDto {
  @IsString()
  @IsNotEmpty({ message: 'refresh_token không được để trống' })
  refresh_token: string;
}