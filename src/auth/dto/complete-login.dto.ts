import { IsString, IsNotEmpty } from 'class-validator';

export class CompleteLoginDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  clientPublicKey: string;

  @IsString()
  @IsNotEmpty()
  clientProof: string;
}
