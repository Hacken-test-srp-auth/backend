import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestApp, clearDatabase } from './utils/setup';
import { srpClientSimulator } from './utils/rps-client-simulator';
import { ethers } from 'ethers';

const TEST_NAME = 'testname';
const TEST_USERNAME = 'testusername';
const TEST_SALT = 'testsalt';
const TEST_EMAIL = 'testemail@gmail.com';
const TEST_VERIFIER = 'testverifier';
const TEST_PASSWORD = 'testpasword';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase(app);
  });

  it('should register a new user', async () => {
    console.log('test is here, all is good!!!');

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: TEST_USERNAME,
        email: TEST_EMAIL,
        name: TEST_NAME,
        salt: TEST_SALT,
        verifier: TEST_VERIFIER,
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('should register and login successfully', async () => {
    const salt = ethers.hexlify(ethers.randomBytes(16));
    const verifier = srpClientSimulator.generateVerifier(
      TEST_EMAIL,
      TEST_PASSWORD,
      salt,
    );

    const registrationResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: TEST_EMAIL,
        username: TEST_USERNAME,
        name: TEST_NAME,
        salt,
        verifier,
      });

    expect(registrationResponse.status).toBe(201);
    expect(registrationResponse.body).toHaveProperty('accessToken');
    expect(registrationResponse.body).toHaveProperty('refreshToken');

    const loginInitResponse = await request(app.getHttpServer())
      .post('/auth/login-init')
      .send({ email: TEST_EMAIL });

    expect(loginInitResponse.status).toBe(200);
    expect(loginInitResponse.body).toHaveProperty('salt');
    expect(loginInitResponse.body).toHaveProperty('serverPublicKey');

    const { clientPublicKey, clientProof } =
      srpClientSimulator.simulateClientSRP(
        TEST_EMAIL,
        TEST_PASSWORD,
        loginInitResponse.body.salt,
        loginInitResponse.body.serverPublicKey,
      );

    const loginCompleteResponse = await request(app.getHttpServer())
      .post('/auth/login-complete')
      .send({
        email: TEST_EMAIL,
        clientPublicKey,
        clientProof,
      });

    console.log(
      '=====================',
      loginCompleteResponse.body,
      '=====================',
    );
    expect(loginCompleteResponse.status).toBe(200);
    expect(loginCompleteResponse.body).toHaveProperty('accessToken');
    expect(loginCompleteResponse.body).toHaveProperty('refreshToken');
    expect(loginCompleteResponse.body).toHaveProperty('M2');
  });
});
