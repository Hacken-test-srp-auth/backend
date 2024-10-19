import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { UserService } from 'src/user/user.service';
import { RegisterDto } from './dto/register.dto';
import { CompleteLoginDto } from './dto/complete-login.dto';
import { ethers } from 'ethers';
import { JwtService } from 'src/jwt/jwt.service';

interface ServerSession {
  serverPrivateKey: bigint;
  serverPublicKey: bigint;
}

@Injectable()
export class AuthService {
  private readonly N = ethers.toBigInt(process.env.N);
  private readonly g = ethers.toBigInt(process.env.g);
  private readonly k = ethers.toBigInt(process.env.k);

  private readonly sessionMap: Map<string, ServerSession> = new Map();
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
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

    this.sessionMap.set(email, { serverPrivateKey, serverPublicKey });

    return {
      salt: user.salt,
      serverPublicKey: serverPublicKey.toString(16),
    };
  }

  async loginComplete(completeLoginDto: CompleteLoginDto) {
    const { email, clientPublicKey, clientProof } = completeLoginDto;

    try {
      const session = this.sessionMap.get(email);
      if (!session) {
        throw new NotFoundException('Login session not found');
      }

      const { serverPrivateKey, serverPublicKey } = session;

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

      const user = await this.userService.findByEmail(email);

      const base =
        (A * this.modPow(ethers.toBigInt(`0x${user.verifier}`), u, this.N)) %
        this.N;

      const S = this.modPow(base, serverPrivateKey, this.N);
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
      this.sessionMap.delete(email);
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
