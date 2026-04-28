import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from '../middleware/auth';

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate middleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = jest.fn();
  });

  it('returns 401 when authorization header is absent', () => {
    const req = { headers: {} } as AuthRequest;
    const res = mockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when header does not use Bearer scheme', () => {
    const req = { headers: { authorization: 'Basic abc123' } } as AuthRequest;
    const res = mockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a malformed token', () => {
    const req = { headers: { authorization: 'Bearer not.valid.token' } } as AuthRequest;
    const res = mockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for a token signed with wrong secret', () => {
    const token = jwt.sign({ userId: 'user123' }, 'wrong_secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next and attaches userId for a valid token', () => {
    const token = jwt.sign({ userId: 'user123' }, 'fallback_secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('user123');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 for an expired token', () => {
    const token = jwt.sign({ userId: 'user123' }, 'fallback_secret', { expiresIn: -1 });
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = mockRes();

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
