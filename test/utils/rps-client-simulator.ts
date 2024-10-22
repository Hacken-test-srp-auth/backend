import { ethers } from 'ethers';

class SRPClientSimulator {
  private N = BigInt(process.env.N);
  private g = BigInt(process.env.g);
  private k = BigInt(process.env.k);

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

    console.log(process.env.N);
    console.log(this.N);
    console.log(
      '0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE65381FFFFFFFFFFFFFFFF',
    );
    console.log(
      BigInt(
        '0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE65381FFFFFFFFFFFFFFFF',
      ),
    );

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
