import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

const N =
  '0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE65381FFFFFFFFFFFFFFFF';

@Injectable()
export class SrpService {
  public readonly N = ethers.toBigInt(N);
  public readonly g = ethers.toBigInt(2);
  public readonly k = ethers.toBigInt(3);

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
