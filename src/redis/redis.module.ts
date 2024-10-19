import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_SESSION_CLIENT = 'REDIS_SESSION_CLIENT';
export const REDIS_BLACKLIST_CLIENT = 'REDIS_BLACKLIST_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_SESSION_CLIENT,
      useFactory: () => {
        const redisClient = new Redis({
          host: process.env.REDIS_SESSION_HOST,
          port: +process.env.REDIS_SESSION_PORT,
          db: +process.env.REDIS_SESSION_DB,
        });

        redisClient.on('error', (err) => {
          console.error('Redis Session Client error:', err);
        });

        return redisClient;
      },
    },
    {
      provide: REDIS_BLACKLIST_CLIENT,
      useFactory: () => {
        const redisClient = new Redis({
          host: process.env.REDIS_BLACKLIST_HOST,
          port: +process.env.REDIS_BLACKLIST_PORT,
          db: +process.env.REDIS_BLACKLIST_DB,
        });

        redisClient.on('error', (err) => {
          console.error('Redis Blacklist Client error:', err);
        });

        return redisClient;
      },
    },
  ],
  exports: [REDIS_SESSION_CLIENT, REDIS_BLACKLIST_CLIENT],
})
export class RedisModule {}
