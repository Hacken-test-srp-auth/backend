import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class SrpService {
  public readonly N = ethers.toBigInt(
    // eslint-disable-next-line no-loss-of-precision
    0xffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd129024e088a67cc74020bbea63b139b22514a08798e3404ddef9519b3cd3a431b302b0a6df25f14374fe1356d6d51c245e485b576625e7ec6f44c42e9a637ed6b0bff5cb6f406b7edee386bfb5a899fa5ae9f24117c4b1fe649286651ece65381ffffffffffffffff,
  );
  public readonly g = ethers.toBigInt(process.env.g);
  public readonly k = ethers.toBigInt(process.env.k);

  generateServerCredentials(verifier: string) {
    const serverPrivateKey = ethers.toBigInt(ethers.randomBytes(32));
    const v = ethers.toBigInt(`0x${verifier}`);
    const serverPublicKey =
      (this.k * v + this.modPow(this.g, serverPrivateKey, this.N)) % this.N;

    return {
      serverPrivateKey: serverPrivateKey,
      serverPublicKey: serverPublicKey,
    };
  }

  verifyLogin(
    clientPublicKey: string,
    clientProof: string,
    serverPrivateKey: string,
    serverPublicKey: string,
    verifier: string,
  ) {
    console.log('its N ===>:', this.N);
    console.log('its env N ===>:', process.env.N);

    const A = ethers.toBigInt(clientPublicKey);
    const serverPrivateKeyBigInt = BigInt(serverPrivateKey);
    const serverPublicKeyBigInt = BigInt(serverPublicKey);
    if (A % this.N === 0n) {
      return { isValid: false, M2: null };
    }
    const u = ethers.toBigInt(
      ethers.keccak256(
        ethers.concat([
          ethers.toBeArray(A),
          ethers.toBeArray(serverPublicKeyBigInt),
        ]),
      ),
    );

    const base =
      (A * this.modPow(ethers.toBigInt(`0x${verifier}`), u, this.N)) % this.N;

    const S = this.modPow(base, serverPrivateKeyBigInt, this.N);

    const K = ethers.keccak256(ethers.toBeArray(S));

    const expectedM1 = ethers.keccak256(
      ethers.concat([
        ethers.toBeArray(A),
        ethers.toBeArray(serverPublicKeyBigInt),
        K,
      ]),
    );

    if (clientProof !== ethers.hexlify(expectedM1)) {
      return { isValid: false, M2: null };
    }

    const M2 = ethers.keccak256(
      ethers.concat([
        ethers.toBeArray(A),
        ethers.toBeArray(ethers.toBigInt(clientProof)),
        K,
      ]),
    );

    return { isValid: true, M2: ethers.hexlify(M2) };
  }

  public modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
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
