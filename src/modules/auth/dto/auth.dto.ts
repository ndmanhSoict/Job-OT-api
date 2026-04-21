// ─── src/modules/auth/dto/login.dto.ts ───────────────────────────────────────
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username/email không được để trống' })
  @MaxLength(255)
  identifier: string; // username hoặc email

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6)
  @MaxLength(100)
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}