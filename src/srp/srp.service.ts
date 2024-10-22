import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class SrpService {
  public readonly N = ethers.toBigInt(process.env.N);
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
    const A = ethers.toBigInt(clientPublicKey);

    const serverPrivateKeyBigInt = ethers.toBigInt(serverPrivateKey);

    const serverPublicKeyBigInt = ethers.toBigInt(serverPublicKey);

    if (A % this.N === 0n) {
      return { isValid: false, M2: null };
    }
    console.log(3, 5);
    const u = ethers.toBigInt(
      ethers.keccak256(
        ethers.concat([
          ethers.toBeArray(A),
          ethers.toBeArray(serverPublicKeyBigInt),
        ]),
      ),
    );
    console.log(3, 6);

    const base =
      (A * this.modPow(ethers.toBigInt(`0x${verifier}`), u, this.N)) % this.N;

    console.log(3, 7);
    const S = this.modPow(base, serverPrivateKeyBigInt, this.N);

    console.log('server S =====>', S);
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
