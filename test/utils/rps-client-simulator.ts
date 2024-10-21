import { ethers } from 'ethers';

class SRPClientSimulator {
  private N = ethers.toBigInt(process.env.N);
  private g = ethers.toBigInt(process.env.g);
  private k = ethers.toBigInt(process.env.k);

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

  simulateClientSRP(
    email: string,
    password: string,
    salt: string,
    serverPublicKey: string,
  ) {
    const x = ethers.toBigInt(
      ethers.keccak256(
        ethers.concat([
          ethers.toBeArray(ethers.toBigInt(salt)),
          ethers.keccak256(
            ethers.concat([
              ethers.toUtf8Bytes(email),
              ethers.toUtf8Bytes(':'),
              ethers.toUtf8Bytes(password),
            ]),
          ),
        ]),
      ),
    );

    const clientPrivateKey = ethers.toBigInt(ethers.randomBytes(32));
    const clientPublicKey = this.modPow(this.g, clientPrivateKey, this.N);

    const bigintServerPublicKey = ethers.toBigInt(`0x${serverPublicKey}`);

    const u = ethers.toBigInt(
      ethers.keccak256(
        ethers.concat([
          ethers.toBeArray(clientPublicKey),
          ethers.toBeArray(ethers.toBigInt(bigintServerPublicKey)),
        ]),
      ),
    );

    const gToX = this.modPow(this.g, x, this.N);
    const kgToX = (this.k * gToX) % this.N;
    const base = (bigintServerPublicKey - kgToX + this.N) % this.N;

    const S = this.modPow(base, clientPrivateKey + u * x, this.N);
    const K = ethers.keccak256(ethers.toBeArray(S));

    const M1 = ethers.keccak256(
      ethers.concat([
        ethers.toBeArray(clientPublicKey),
        ethers.toBeArray(BigInt(bigintServerPublicKey)),
        K,
      ]),
    );

    return {
      clientPublicKey: clientPublicKey.toString(),
      clientProof: ethers.hexlify(M1),
    };
  }

  generateVerifier(email: string, password: string, salt: string): string {
    const x = ethers.toBigInt(
      ethers.keccak256(
        ethers.concat([
          ethers.toBeArray(ethers.toBigInt(salt)),
          ethers.keccak256(
            ethers.concat([
              ethers.toUtf8Bytes(email),
              ethers.toUtf8Bytes(':'),
              ethers.toUtf8Bytes(password),
            ]),
          ),
        ]),
      ),
    );

    return this.modPow(this.g, x, this.N).toString(16);
  }
}

export const srpClientSimulator = new SRPClientSimulator();
