import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import * as api from '../api';

vi.mock('../api', () => ({
  login: vi.fn(),
  register: vi.fn(),
  sendQuery: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

const submitAuth = () => fireEvent.click(screen.getByTestId('auth-submit'));

describe('Auth screen', () => {
  it('renders login form by default', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByTestId('auth-submit')).toHaveTextContent('Login');
  });

  it('switches to register form when Register tab is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByTestId('auth-submit')).toHaveTextContent('Create Account');
  });

  it('shows auth error when login fails', async () => {
    vi.mocked(api.login).mockResolvedValue({ error: 'Invalid credentials' });
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'user' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
    submitAuth();

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows auth error when registration fails', async () => {
    vi.mocked(api.register).mockResolvedValue({ error: 'Username already taken' });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'taken' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass123' } });
    submitAuth();

    await waitFor(() => {
      expect(screen.getByText('Username already taken')).toBeInTheDocument();
    });
  });

  it('clears auth error when switching tabs', async () => {
    vi.mocked(api.login).mockResolvedValue({ error: 'Invalid credentials' });
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'user' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } });
    submitAuth();

    await waitFor(() => screen.getByText('Invalid credentials'));

    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
  });
});

describe('Chat screen', () => {
  const loginSuccessfully = async () => {
    vi.mocked(api.login).mockResolvedValue({ token: 'fake-token', username: 'testuser' });
    render(<App />);
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    submitAuth();
    await waitFor(() => screen.getByPlaceholderText('Type your question...'));
  };

  it('shows chat interface after successful login', async () => {
    await loginSuccessfully();
    expect(screen.getByText(/Hello,/)).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your question...')).toBeInTheDocument();
  });

  it('shows empty state prompt on a fresh session', async () => {
    await loginSuccessfully();
    expect(screen.getByText('Ask me anything...')).toBeInTheDocument();
  });

  it('sends query and displays both user message and AI response', async () => {
    vi.mocked(api.sendQuery).mockResolvedValue({ response: 'AI says hello!' });
    await loginSuccessfully();

    fireEvent.change(screen.getByPlaceholderText('Type your question...'), {
      target: { value: 'Hello AI' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('Hello AI')).toBeInTheDocument();
      expect(screen.getByText('AI says hello!')).toBeInTheDocument();
    });
  });

  it('shows query error when AI request fails', async () => {
    vi.mocked(api.sendQuery).mockResolvedValue({ error: 'API quota exceeded' });
    await loginSuccessfully();

    fireEvent.change(screen.getByPlaceholderText('Type your question...'), {
      target: { value: 'test query' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('API quota exceeded')).toBeInTheDocument();
    });
  });

  it('logs out and returns to login screen', async () => {
    await loginSuccessfully();
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
  });

  it('auto-logs out when server returns a token error', async () => {
    vi.mocked(api.sendQuery).mockResolvedValue({ error: 'Invalid or expired token' });
    await loginSuccessfully();

    fireEvent.change(screen.getByPlaceholderText('Type your question...'), {
      target: { value: 'test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    });
  });
});
