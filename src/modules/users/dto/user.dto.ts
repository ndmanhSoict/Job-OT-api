import {
  IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional,
  IsString, Matches, MaxLength, MinLength,
} from 'class-validator';
import { UserRole } from '@shared/constants/enums';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|:;"'<>,.?/~`\\])/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'username không được để trống' })
  @MinLength(3, { message: 'username tối thiểu 3 ký tự' })
  @MaxLength(100, { message: 'username tối đa 100 ký tự' })
  @Matches(USERNAME_REGEX, { message: 'username chỉ được chứa chữ cái, số và dấu _' })
  username: string;

  @IsEmail({}, { message: 'email không hợp lệ' })
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password không được để trống' })
  @MinLength(8, { message: 'password tối thiểu 8 ký tự' })
  @MaxLength(255)
  @Matches(PASSWORD_REGEX, {
    message: 'password phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'full_name không được để trống' })
  @MaxLength(255)
  full_name: string;

  @IsEnum(UserRole, { message: 'role phải là admin hoặc staff' })
  role: UserRole;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'full_name không được để trống' })
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'email không hợp lệ' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'role phải là admin hoặc staff' })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'new_password không được để trống' })
  @MinLength(8, { message: 'new_password tối thiểu 8 ký tự' })
  @MaxLength(255)
  @Matches(PASSWORD_REGEX, {
    message: 'new_password phải có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  })
  new_password: string;
}
