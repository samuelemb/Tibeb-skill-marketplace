import { authenticate, requireRole } from '../../src/middleware/auth';
import { generateToken } from '../../src/utils/jwt';
import type { Request, Response, NextFunction } from 'express';

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockNext = () => jest.fn() as NextFunction;

describe('Auth middleware', () => {
  it('authenticate sets req.user and calls next', () => {
    const token = generateToken({
      userId: 'user-1',
      email: 'user@example.com',
      role: 'CLIENT',
    });
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const res = mockResponse();
    const next = mockNext();

    authenticate(req, res, next);
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalled();
  });

  it('authenticate returns 401 without token', () => {
    const req = { headers: {} } as Request;
    const res = mockResponse();
    const next = mockNext();

    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('requireRole blocks when user missing', () => {
    const req = {} as Request;
    const res = mockResponse();
    const next = mockNext();

    requireRole('CLIENT')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('requireRole blocks when role not allowed', () => {
    const req = { user: { role: 'FREELANCER' } } as Request;
    const res = mockResponse();
    const next = mockNext();

    requireRole('CLIENT')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('requireRole allows when role matches', () => {
    const req = { user: { role: 'CLIENT' } } as Request;
    const res = mockResponse();
    const next = mockNext();

    requireRole('CLIENT')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
