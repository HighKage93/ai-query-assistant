import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';

jest.mock('../services/gemini', () => ({
  queryGeminiStream: jest.fn(),
}));

jest.mock('../models/Chat', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

import { queryGeminiStream } from '../services/gemini';
import Chat from '../models/Chat';

const TEST_SECRET = 'test-jwt-secret-for-query-tests';
let validToken: string;

async function* mockStream(chunks: string[]) {
  for (const chunk of chunks) {
    yield { text: chunk };
  }
}

const parseSSE = (text: string) =>
  text
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => JSON.parse(line.slice(6)));

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
  validToken = jwt.sign({ userId: 'user123' }, TEST_SECRET);
});

describe('POST /api/query', () => {
  it('streams AI response chunks and a done event', async () => {
    (queryGeminiStream as jest.Mock).mockReturnValue(mockStream(['Hello', ' world']));
    (Chat.create as jest.Mock).mockResolvedValue({ _id: 'chat123' });

    const res = await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: 'What is AI?' });

    expect(res.status).toBe(200);
    expect(res.type).toBe('text/event-stream');

    const events = parseSSE(res.text);
    const text = events.filter((e) => e.chunk).map((e) => e.chunk).join('');
    expect(text).toBe('Hello world');

    const done = events.find((e) => e.done);
    expect(done).toBeDefined();
    expect(typeof done.duration).toBe('number');
  });

  it('trims whitespace from query before calling gemini', async () => {
    (queryGeminiStream as jest.Mock).mockReturnValue(mockStream(['ok']));
    (Chat.create as jest.Mock).mockResolvedValue({ _id: 'chat123' });

    await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: '  hello world  ' });

    expect(queryGeminiStream).toHaveBeenCalledWith('hello world');
  });

  it('appends to existing chat when chatId is provided', async () => {
    (queryGeminiStream as jest.Mock).mockReturnValue(mockStream(['response']));
    (Chat.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

    await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: 'follow-up question', chatId: 'existing-chat-id' });

    expect(Chat.findByIdAndUpdate).toHaveBeenCalledWith(
      'existing-chat-id',
      expect.objectContaining({ $push: expect.anything() }),
    );
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

  it('returns 401 without an auth token', async () => {
    const res = await request(app)
      .post('/api/query')
      .send({ query: 'What is AI?' });

    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .post('/api/query')
      .set('Authorization', 'Bearer not.a.valid.token')
      .send({ query: 'What is AI?' });

    expect(res.status).toBe(401);
  });

  it('streams an error event on gemini timeout', async () => {
    (queryGeminiStream as jest.Mock).mockRejectedValue(new Error('DEADLINE_EXCEEDED'));

    const res = await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: 'What is AI?' });

    expect(res.status).toBe(200);
    const events = parseSSE(res.text);
    const errorEvent = events.find((e) => e.error);
    expect(errorEvent?.error).toMatch(/timed out/i);
  });

  it('streams an error event on quota exhaustion', async () => {
    (queryGeminiStream as jest.Mock).mockRejectedValue(new Error('RESOURCE_EXHAUSTED'));

    const res = await request(app)
      .post('/api/query')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ query: 'What is AI?' });

    const events = parseSSE(res.text);
    const errorEvent = events.find((e) => e.error);
    expect(errorEvent?.error).toMatch(/quota/i);
  });
});
