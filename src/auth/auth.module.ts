import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtModule } from '../jwt/jwt.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [UserModule, JwtModule],
})
export class AuthModule {}
