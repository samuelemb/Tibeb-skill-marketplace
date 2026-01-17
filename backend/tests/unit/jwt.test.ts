import { extractTokenFromHeader, generateToken, verifyToken } from '../../src/utils/jwt';

describe('JWT utils', () => {
  it('generates and verifies token', () => {
    const token = generateToken({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'CLIENT',
    });

    const payload = verifyToken(token);
    expect(payload.userId).toBe('user-1');
    expect(payload.email).toBe('user@example.com');
    expect(payload.role).toBe('CLIENT');
  });

  it('extracts token from header', () => {
    const token = 'abc.def.ghi';
    const extracted = extractTokenFromHeader(`Bearer ${token}`);
    expect(extracted).toBe(token);
  });

  it('returns null for invalid header', () => {
    expect(extractTokenFromHeader(undefined)).toBeNull();
    expect(extractTokenFromHeader('Token abc')).toBeNull();
  });
});
