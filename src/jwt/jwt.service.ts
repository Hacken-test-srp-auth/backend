/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { REDIS_BLACKLIST_CLIENT } from 'src/redis/redis.module';

@Injectable()
export class JwtService {
  private readonly JWT_SECRET = process.env.JWT_SECRET;
  private readonly JWT_EXPIRATION_TIME = process.env.JWT_EXPIRATION_TIME;
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  private readonly JWT_REFRESH_EXPIRATION_TIME =
    process.env.JWT_REFRESH_EXPIRATION_TIME;
  private readonly BLACKLIST_TTL = 60 * 60;

  constructor(
    private nestJwtService: NestJwtService,
    @Inject(REDIS_BLACKLIST_CLIENT)
    private readonly redisInvalidTokens: Redis,
  ) {}

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
    const accessToken = await this.generateToken(payload.sub);
    const newRefreshToken = await this.generateRefreshToken(payload.sub);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async addToBlacklist(token: string): Promise<void> {
    await this.redisInvalidTokens.set(
      `bl_${token}`,
      '1',
      'EX',
      this.BLACKLIST_TTL,
    );
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redisInvalidTokens.exists(`bl_${token}`);
    return exists === 1;
  }

  async invalidateTokens(
    accessToken: string,
    refreshToken: string,
  ): Promise<void> {
    await Promise.all([
      this.addToBlacklist(accessToken),
      this.addToBlacklist(refreshToken),
    ]);
  }
}
