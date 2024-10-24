import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestApp, clearDatabase } from './utils/setup';
import { srpClientSimulator } from './utils/rps-client-simulator';
import { ethers } from 'ethers';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  const TEST_USER = {
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    password: 'correctpassword',
  };

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
    const salt = ethers.hexlify(ethers.randomBytes(16));
    const verifier = srpClientSimulator.generateVerifier(
      TEST_USER.email,
      TEST_USER.password,
      salt,
    );

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: TEST_USER.email,
        username: TEST_USER.username,
        name: TEST_USER.name,
        salt,
        verifier,
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
  });

  it('should login successfully with correct credentials', async () => {
    // First register the user
    const salt = ethers.hexlify(ethers.randomBytes(16));
    const verifier = srpClientSimulator.generateVerifier(
      TEST_USER.email,
      TEST_USER.password,
      salt,
    );

    await request(app.getHttpServer()).post('/auth/register').send({
      email: TEST_USER.email,
      username: TEST_USER.username,
      name: TEST_USER.name,
      salt,
      verifier,
    });

    // Then try to login
    const initResponse = await request(app.getHttpServer())
      .post('/auth/login-init')
      .send({ email: TEST_USER.email })
      .expect(200);

    const { clientPublicKey, clientProof } =
      srpClientSimulator.simulateClientSRP(
        TEST_USER.email,
        TEST_USER.password,
        initResponse.body.salt,
        initResponse.body.serverPublicKey,
      );

    const completeResponse = await request(app.getHttpServer())
      .post('/auth/login-complete')
      .send({
        email: TEST_USER.email,
        clientPublicKey,
        clientProof,
      })
      .expect(200);

    expect(completeResponse.body).toHaveProperty('accessToken');
    expect(completeResponse.body).toHaveProperty('refreshToken');
    expect(completeResponse.body).toHaveProperty('M2');
  });

  it('should fail login with incorrect password', async () => {
    // First register the user
    const salt = ethers.hexlify(ethers.randomBytes(16));
    const verifier = srpClientSimulator.generateVerifier(
      TEST_USER.email,
      TEST_USER.password,
      salt,
    );

    await request(app.getHttpServer()).post('/auth/register').send({
      email: TEST_USER.email,
      username: TEST_USER.username,
      name: TEST_USER.name,
      salt,
      verifier,
    });

    // Try to login with wrong password
    const initResponse = await request(app.getHttpServer())
      .post('/auth/login-init')
      .send({ email: TEST_USER.email })
      .expect(200);

    const { clientPublicKey, clientProof } =
      srpClientSimulator.simulateClientSRP(
        TEST_USER.email,
        'wrongpassword',
        initResponse.body.salt,
        initResponse.body.serverPublicKey,
      );

    await request(app.getHttpServer())
      .post('/auth/login-complete')
      .send({
        email: TEST_USER.email,
        clientPublicKey,
        clientProof,
      })
      .expect(401);
  });
});
