import { IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  salt: string;

  @IsString()
  verifier: string;
}
