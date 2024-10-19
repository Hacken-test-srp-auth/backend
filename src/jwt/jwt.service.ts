/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class JwtService {
  private readonly JWT_SECRET = process.env.JWT_SECRET;
  private readonly JWT_EXPIRATION_TIME =
    process.env.JWT_EXPIRATION_TIME || '1h';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  private readonly JWT_REFRESH_EXPIRATION_TIME =
    process.env.JWT_REFRESH_EXPIRATION_TIME || '7d';

  constructor(private nestJwtService: NestJwtService) {}

  async generateToken(payload: any): Promise<string> {
    return this.nestJwtService.sign(payload, {
      secret: this.JWT_SECRET,
      expiresIn: this.JWT_EXPIRATION_TIME,
    });
  }

  async verifyToken(token: string): Promise<any> {
    return this.nestJwtService.verify(token, { secret: this.JWT_SECRET });
  }

  async decodeToken(token: string): Promise<any> {
    return this.nestJwtService.decode(token);
  }

  async generateRefreshToken(payload: any): Promise<string> {
    return this.nestJwtService.sign(payload, {
      secret: this.JWT_REFRESH_SECRET,
      expiresIn: this.JWT_REFRESH_EXPIRATION_TIME,
    });
  }

  async verifyRefreshToken(token: string): Promise<any> {
    return this.nestJwtService.verify(token, {
      secret: this.JWT_REFRESH_SECRET,
    });
  }

  async createTokens(userId: string) {
    const payload = { sub: userId };
    const accessToken = await this.generateToken(payload);
    const refreshToken = await this.generateRefreshToken(payload);

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    console.log('verify token =======>', payload);
    const accessToken = await this.generateToken(payload.sub);
    const newRefreshToken = await this.generateRefreshToken(payload.sub);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
