import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/database';
import { resetDb, registerUser, verifyUser, loginUser } from '../utils';

describe('Auth flows', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('registers a user (requires verification)', async () => {
    const response = await registerUser({
      email: 'client1@example.com',
      password: 'password123',
      firstName: 'Client',
      lastName: 'One',
      role: 'CLIENT',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.requiresVerification).toBe(true);
  });

  it('prevents login before OTP verified', async () => {
    await registerUser({
      email: 'client2@example.com',
      password: 'password123',
      firstName: 'Client',
      lastName: 'Two',
      role: 'CLIENT',
    });

    const response = await loginUser('client2@example.com', 'password123');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('verifies OTP and allows login', async () => {
    await registerUser({
      email: 'client3@example.com',
      password: 'password123',
      firstName: 'Client',
      lastName: 'Three',
      role: 'CLIENT',
    });

    const verifyResponse = await verifyUser('client3@example.com');
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.success).toBe(true);
    expect(verifyResponse.body.data.token).toBeDefined();

    const loginResponse = await loginUser('client3@example.com', 'password123');
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);
  });

  it('prevents login with wrong password', async () => {
    await registerUser({
      email: 'client4@example.com',
      password: 'password123',
      firstName: 'Client',
      lastName: 'Four',
      role: 'CLIENT',
    });
    await verifyUser('client4@example.com');

    const response = await loginUser('client4@example.com', 'wrongpassword');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('resets password with OTP', async () => {
    await registerUser({
      email: 'client5@example.com',
      password: 'password123',
      firstName: 'Client',
      lastName: 'Five',
      role: 'CLIENT',
    });
    await verifyUser('client5@example.com');

    const requestReset = await request(app).post('/api/auth/request-password-reset').send({
      email: 'client5@example.com',
    });
    expect(requestReset.status).toBe(200);

    const user = await prisma.user.findUnique({ where: { email: 'client5@example.com' } });
    expect(user?.passwordResetCode).toBeTruthy();

    const resetResponse = await request(app).post('/api/auth/reset-password').send({
      email: 'client5@example.com',
      code: user?.passwordResetCode,
      newPassword: 'newpassword123',
    });
    expect(resetResponse.status).toBe(200);

    const loginResponse = await loginUser('client5@example.com', 'newpassword123');
    expect(loginResponse.status).toBe(200);
  });
});
