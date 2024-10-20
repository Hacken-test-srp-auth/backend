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
import { ethers } from 'ethers';
import { JwtService } from '../jwt/jwt.service';
import Redis from 'ioredis';
import { REDIS_LOGIN_STORAGE } from '../redis/redis.module';
import { User } from '../user/entities/user.entity';

interface ServerSession {
  serverPrivateKey: string;
  serverPublicKey: string;
  user: User;
}

@Injectable()
export class AuthService {
  private readonly N = ethers.toBigInt(process.env.N);
  private readonly g = ethers.toBigInt(process.env.g);
  private readonly k = ethers.toBigInt(process.env.k);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
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

    const serverPrivateKey = ethers.toBigInt(ethers.randomBytes(32));
    const v = ethers.toBigInt(`0x${user.verifier}`);
    const serverPublicKey =
      (this.k * v + this.modPow(this.g, serverPrivateKey, this.N)) % this.N;

    const loginProcessSession: ServerSession = {
      serverPrivateKey: serverPrivateKey.toString(),
      serverPublicKey: serverPublicKey.toString(),
      user,
    };

    await this.redisLoginStorage.set(
      `session:${email}`,
      JSON.stringify(loginProcessSession),
      'EX',
      60,
    );

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

      const serverPrivateKey = BigInt(session.serverPrivateKey);
      const serverPublicKey = BigInt(session.serverPublicKey);
      const { user } = session;

      const M1 = clientProof;
      const A = ethers.toBigInt(clientPublicKey);

      if (A % this.N === 0n) {
        throw new UnauthorizedException('Invalid client public key');
      }

      const u = ethers.toBigInt(
        ethers.keccak256(
          ethers.concat([
            ethers.toBeArray(A), // client public key
            ethers.toBeArray(serverPublicKey), // server public key
          ]),
        ),
      );

      const base =
        (A * this.modPow(ethers.toBigInt(`0x${user.verifier}`), u, this.N)) %
        this.N;

      const S = this.modPow(base, ethers.toBigInt(serverPrivateKey), this.N);
      const K = ethers.keccak256(ethers.toBeArray(S));

      const expectedM1 = ethers.keccak256(
        ethers.concat([
          ethers.toBeArray(A),
          ethers.toBeArray(serverPublicKey),
          K,
        ]),
      );

      if (M1 !== ethers.hexlify(expectedM1)) {
        throw new UnauthorizedException('Invalid client proof');
      }

      const M2 = ethers.keccak256(
        ethers.concat([
          ethers.toBeArray(A),
          ethers.toBeArray(ethers.toBigInt(M1)),
          K,
        ]),
      );

      const tokens = await this.jwtService.createTokens(user.id);
      return { ...tokens, M2: M2 };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException(error);
    } finally {
      await this.redisLoginStorage.del(`session:${email}`);
    }
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    await this.jwtService.invalidateTokens(accessToken, refreshToken);
  }

  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    let result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
      if (exponent % 2n === 1n) {
        result = (result * base) % modulus;
      }
      exponent = exponent / 2n;
      base = (base * base) % modulus;
    }
    return result;
  }
}
