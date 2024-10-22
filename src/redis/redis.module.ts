import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_LOGIN_STORAGE = 'REDIS_LOGIN_STORAGE';
export const REDIS_INVALID_TOKENS = 'REDIS_INVALID_TOKENS';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_LOGIN_STORAGE,
      useFactory: () => {
        const redisClient = new Redis({
          host: process.env.REDIS_SESSION_HOST,
          port: +process.env.REDIS_SESSION_PORT,
          db: +process.env.REDIS_SESSION_DB,
        });
        return redisClient;
      },
    },
    {
      provide: REDIS_INVALID_TOKENS,
      useFactory: () => {
        const redisClient = new Redis({
          host: process.env.REDIS_BLACKLIST_HOST,
          port: +process.env.REDIS_BLACKLIST_PORT,
          db: +process.env.REDIS_BLACKLIST_DB,
        });
        return redisClient;
      },
    },
  ],
  exports: [REDIS_LOGIN_STORAGE, REDIS_INVALID_TOKENS],
})
export class RedisModule {}
