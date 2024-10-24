import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestApp, clearDatabase } from './utils/setup';
import { srpClientSimulator } from './utils/rps-client-simulator';
import { ethers } from 'ethers';

describe('Profile (e2e)', () => {
  let app: INestApplication;
  let authTokens: { accessToken: string; refreshToken: string };

  const TEST_USER = {
    email: 'test@example.com',
    username: 'testuser',
    name: 'Test User',
    password: 'testpassword',
  };

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase(app);

    // Register a test user before each test
    const salt = ethers.hexlify(ethers.randomBytes(16));
    const verifier = srpClientSimulator.generateVerifier(
      TEST_USER.email,
      TEST_USER.password,
      salt,
    );

    const registrationResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: TEST_USER.email,
        username: TEST_USER.username,
        name: TEST_USER.name,
        salt,
        verifier,
      });

    authTokens = {
      accessToken: registrationResponse.body.accessToken,
      refreshToken: registrationResponse.body.refreshToken,
    };
  });

  describe('GET /profile', () => {
    it('should get user profile when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        email: TEST_USER.email,
        username: TEST_USER.username,
        name: TEST_USER.name,
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/profile').expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('PATCH /profile', () => {
    it('should update user name', async () => {
      const newName = 'Updated Name';

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({ name: newName })
        .expect(200);

      expect(response.body.name).toBe(newName);
      expect(response.body.email).toBe(TEST_USER.email); // Other fields should remain unchanged
      expect(response.body.username).toBe(TEST_USER.username);
    });

    it('should update username', async () => {
      const newUsername = 'newusername';

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({ username: newUsername })
        .expect(200);

      expect(response.body.username).toBe(newUsername);
      expect(response.body.name).toBe(TEST_USER.name); // Other fields should remain unchanged
      expect(response.body.email).toBe(TEST_USER.email);
    });

    it('should update both name and username simultaneously', async () => {
      const updates = {
        name: 'New Name',
        username: 'newusername',
      };

      const response = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.username).toBe(updates.username);
      expect(response.body.email).toBe(TEST_USER.email);
    });

    it('should return 401 when trying to update profile without authentication', async () => {
      await request(app.getHttpServer())
        .patch('/profile')
        .send({ name: 'New Name' })
        .expect(401);
    });

    it('should return 400 when sending invalid data', async () => {
      const res = await request(app.getHttpServer())
        .patch('/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({ name: 6 });

      expect(res.status).toBe(400);
    });
  });
});
