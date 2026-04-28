import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, register, sendQuery } from '../api';

describe('api', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('login calls the correct endpoint with credentials', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ token: 'tok', username: 'user' }),
    });

    const result = await login('user', 'pass');

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user', password: 'pass' }),
    });
    expect(result).toEqual({ token: 'tok', username: 'user' });
  });

  it('register calls the correct endpoint with credentials', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ token: 'tok', username: 'newuser' }),
    });

    const result = await register('newuser', 'password123');

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'newuser', password: 'password123' }),
    });
    expect(result).toEqual({ token: 'tok', username: 'newuser' });
  });

  it('sendQuery calls the correct endpoint with Bearer token', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ response: 'AI response' }),
    });

    const result = await sendQuery('What is life?', 'my-token');

    expect(mockFetch).toHaveBeenCalledWith('/api/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-token',
      },
      body: JSON.stringify({ query: 'What is life?' }),
    });
    expect(result).toEqual({ response: 'AI response' });
  });

  it('login returns error object on failed auth', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    });

    const result = await login('user', 'wrongpass');
    expect(result).toEqual({ error: 'Invalid credentials' });
  });

  it('sendQuery returns error object when token is invalid', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ error: 'Invalid or expired token' }),
    });

    const result = await sendQuery('hello', 'bad-token');
    expect(result).toEqual({ error: 'Invalid or expired token' });
  });
});
