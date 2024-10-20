import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestApp, clearDatabase } from './utils/setup';

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
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        salt: 'testsalt',
        verifier: 'testverifier',
      })
      .expect(201);

    console.log(response.body);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    // Тест буде тут
  });

  // Інші тести будуть додані пізніше
});
