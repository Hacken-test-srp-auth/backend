import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { CompleteLoginDto } from './dto/complete-login.dto';
import { JwtService } from '../jwt/jwt.service';
import Redis from 'ioredis';
import { REDIS_LOGIN_STORAGE } from '../redis/redis.module';
import { User } from '../user/entities/user.entity';
import { SrpService } from '../srp/srp.service';

interface ServerSession {
  serverPrivateKey: string;
  serverPublicKey: string;
  user: User;
}

@Injectable()
export class AuthService {
  private LOGIN_STORAGE_TTL = 60;
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private srpService: SrpService,
    @Inject(REDIS_LOGIN_STORAGE)
    private readonly redisLoginStorage: Redis,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, name, salt, email, verifier } = registerDto;

    const ifUserExists = await this.userService.findByEmail(email);
    if (ifUserExists) {
      throw new ConflictException(
        `User with this email: ${email} already exist`,
      );
    }

    const user = await this.userService.create({
      username,
      name,
      salt,
      email,
      verifier,
    });

    return await this.jwtService.createTokens(user.id);
  }

  async loginInit(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(
        `User with this email: ${email} does not exist`,
      );
    }

    const { serverPrivateKey, serverPublicKey } =
      this.srpService.generateServerCredentials(user.verifier);

    const loginProcessSession: ServerSession = {
      serverPrivateKey: serverPrivateKey.toString(16),
      serverPublicKey: serverPublicKey.toString(16),
      user,
    };

    try {
      await this.redisLoginStorage.set(
        `session:${email}`,
        JSON.stringify(loginProcessSession),
        'EX',
        this.LOGIN_STORAGE_TTL,
      );
    } catch (error) {
      console.log('put in redis : ', error);
    }

    return {
      salt: user.salt,
      serverPublicKey: serverPublicKey.toString(16),
    };
  }

  async loginComplete(completeLoginDto: CompleteLoginDto) {
    const { email, clientPublicKey, clientProof } = completeLoginDto;

    try {
      const session = JSON.parse(
        await this.redisLoginStorage.get(`session:${email}`),
      );
      if (!session) {
        throw new NotFoundException('Login session not found');
      }

      const { serverPrivateKey, serverPublicKey, user } = session;

      const { isValid, M2 } = this.srpService.verifyLogin(
        clientPublicKey,
        clientProof,
        serverPrivateKey,
        serverPublicKey,
        user.verifier,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid client proof');
      }

      const tokens = await this.jwtService.createTokens(user.id);
      return { ...tokens, M2: M2 };
    } catch (error) {
      console.log('===========   error    ======');
      console.log(error);
      throw new UnauthorizedException(error);
    } finally {
      await this.redisLoginStorage.del(`session:${email}`);
    }
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    await this.jwtService.invalidateTokens(accessToken, refreshToken);
  }
}
