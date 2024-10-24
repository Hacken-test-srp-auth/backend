import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(20, { message: 'Name cannot be longer than 50 characters' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(20, { message: 'Name cannot be longer than 50 characters' })
  username: string;
}
