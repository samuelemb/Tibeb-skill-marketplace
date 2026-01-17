import {
  registerSchema,
  createAdminSchema,
  updateJobStatusSchema,
  createReviewSchema,
} from '../../src/utils/validation';

describe('Validation schemas', () => {
  it('accepts valid register payload', () => {
    const payload = registerSchema.parse({
      email: 'user@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'CLIENT',
    });
    expect(payload.role).toBe('CLIENT');
  });

  it('rejects invalid register role', () => {
    expect(() =>
      registerSchema.parse({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
      })
    ).toThrow();
  });

  it('rejects short admin password', () => {
    expect(() =>
      createAdminSchema.parse({
        email: 'admin@example.com',
        password: 'short',
        firstName: 'Admin',
        lastName: 'User',
      })
    ).toThrow();
  });

  it('accepts valid job status update', () => {
    const payload = updateJobStatusSchema.parse({
      status: 'COMPLETED',
    });
    expect(payload.status).toBe('COMPLETED');
  });

  it('rejects invalid review rating', () => {
    expect(() =>
      createReviewSchema.parse({
        jobId: 'job-1',
        revieweeId: 'user-2',
        rating: 6,
      })
    ).toThrow();
  });
});
