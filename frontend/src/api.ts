import { API_BASE } from './config';

export const register = (username: string, password: string) =>
  fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then((r) => r.json());

export const login = (username: string, password: string) =>
  fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  }).then((r) => r.json());

export const streamQuery = async (
  query: string,
  chatId: string | null,
  token: string,
  onChunk: (chunk: string) => void,
  onDone: (duration: number, chatId: string) => void,
  onError: (error: string) => void,
): Promise<void> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, chatId }),
    });
  } catch {
    onError('Network error. Please check your connection.');
    return;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    onError(data.error || 'Request failed');
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.chunk) onChunk(data.chunk);
        if (data.done) onDone(data.duration, data.chatId);
        if (data.error) onError(data.error);
      } catch {
        // malformed SSE line
      }
    }
  }
};

// Throws an error with .status = 401 on auth failure so callers can redirect
const authFetch = async (url: string, token: string, options: RequestInit = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed') as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return data;
};

export const getChats = (token: string) =>
  authFetch(`${API_BASE}/chats`, token);

export const getChat = (id: string, token: string) =>
  authFetch(`${API_BASE}/chats/${id}`, token);

export const deleteChat = (id: string, token: string) =>
  authFetch(`${API_BASE}/chats/${id}`, token, { method: 'DELETE' });

// Keep for backward-compat with existing tests
export const sendQuery = (query: string, token: string) =>
  fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
  }).then((r) => r.json());
