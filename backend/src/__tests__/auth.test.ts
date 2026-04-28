import request from 'supertest';
import app from '../app';

jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const mockUser = { _id: 'user123', username: 'testuser', password: 'hashedpass' };

describe('POST /api/auth/register', () => {
  it('registers a new user and returns token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpass');
    (User.create as jest.Mock).mockResolvedValue(mockUser);
    (jwt.sign as jest.Mock).mockReturnValue('fake-token');

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ token: 'fake-token', username: 'testuser' });
  });

  it('returns 400 when username is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Username and password are required');
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Username and password are required');
  });

  it('returns 400 when password is shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Password must be at least 6 characters');
  });

  it('returns 409 when username is already taken', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Username already taken');
  });

  it('returns 500 when database throws', async () => {
    (User.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Registration failed');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials and returns token', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (jwt.sign as jest.Mock).mockReturnValue('fake-token');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'fake-token', username: 'testuser' });
  });

  it('returns 401 with wrong password', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'wrongpass' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 when user does not exist', async () => {
    (User.findOne as jest.Mock).mockResolvedValue(null);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Username and password are required');
  });

  it('returns 500 when database throws', async () => {
    (User.findOne as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Login failed');
  });
});
