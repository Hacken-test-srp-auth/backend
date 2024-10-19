import { Global, Module } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { JwtController } from './jwt.controller';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    NestJwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [JwtController],
  exports: [JwtService],
  providers: [JwtService, JwtStrategy, PassportModule],
})
export class JwtModule {}
