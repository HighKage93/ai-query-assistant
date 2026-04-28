import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';

jest.mock('../services/gemini', () => ({
  queryGemini: jest.fn(),
}));

import { queryGemini } from '../services/gemini';

const TEST_SECRET = 'test-jwt-secret-for-query-tests';
let validToken: string;

beforeAll(() => {
  // Override any JWT_SECRET from .env so token signing and verification use the same value
  process.env.JWT_SECRET = TEST_SECRET;
  validToken = jwt.sign({ userId: 'user123' }, TEST_SECRET);
});

describe('POST /api/query', () => {
  it('returns AI response for a valid authenticated query', async () => {
    (queryGemini as jest.Mock).mockResolvedValue('Artificial intelligence is...');

    const res = await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: 'What is AI?' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ response: 'Artificial intelligence is...' });
    expect(queryGemini).toHaveBeenCalledWith('What is AI?');
  });

  it('trims whitespace from query before calling gemini', async () => {
    (queryGemini as jest.Mock).mockResolvedValue('ok');

    await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: '  hello world  ' });

    expect(queryGemini).toHaveBeenCalledWith('hello world');
  });

  it('returns 400 for an empty query', async () => {
    const res = await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Query cannot be empty');
  });

  it('returns 400 for a whitespace-only query', async () => {
    const res = await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Query cannot be empty');
  });

  it('returns 400 when query field is missing', async () => {
    const res = await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Query cannot be empty');
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .post('/api/query')
      .send({ query: 'What is AI?' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .post('/api/query')
      .set('Authorization', 'Bearer not.a.valid.token')
      .send({ query: 'What is AI?' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });

  it('returns 504 when gemini times out', async () => {
    (queryGemini as jest.Mock).mockRejectedValue(new Error('DEADLINE_EXCEEDED'));

    const res = await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: 'What is AI?' });

    expect(res.status).toBe(504);
    expect(res.body.error).toMatch(/timed out/i);
  });

  it('returns 429 when API quota is exhausted', async () => {
    (queryGemini as jest.Mock).mockRejectedValue(new Error('RESOURCE_EXHAUSTED'));

    const res = await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: 'What is AI?' });

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/quota/i);
  });

  it('returns 500 on unexpected gemini error', async () => {
    (queryGemini as jest.Mock).mockRejectedValue(new Error('Something broke'));

    const res = await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: 'What is AI?' });

    expect(res.status).toBe(500);
  });
});
