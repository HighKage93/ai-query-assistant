import { useState } from 'react';
import { login as apiLogin, register as apiRegister, sendQuery } from './api';

type AuthView = 'login' | 'register';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');
  const [authView, setAuthView] = useState<AuthView>('login');
  const [formUser, setFormUser] = useState('');
  const [formPass, setFormPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const fn = authView === 'login' ? apiLogin : apiRegister;
    const data = await fn(formUser, formPass);
    if (data.error) {
      setAuthError(data.error);
      return;
    }
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    setToken(data.token);
    setUsername(data.username);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken('');
    setUsername('');
    setMessages([]);
    setFormUser('');
    setFormPass('');
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setQuery('');
    setQueryError('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);

    const data = await sendQuery(trimmed, token);
    setLoading(false);

    if (data.error) {
      if (data.error.toLowerCase().includes('token')) {
        handleLogout();
        return;
      }
      setQueryError(data.error);
      return;
    }
    setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
  };

  if (token) {
    return (
      <div className="app">
        <header>
          <h1>AI Query Assistant</h1>
          <div className="user-bar">
            <span>
              Hello, <strong>{username}</strong>
            </span>
            <button className="btn-ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="chat">
          {messages.length === 0 && (
            <p className="empty">Ask me anything...</p>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`bubble ${msg.role}`}>
              <span className="label">{msg.role === 'user' ? 'You' : 'AI'}</span>
              <p>{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className="bubble assistant">
              <span className="label">AI</span>
              <p className="thinking">Thinking...</p>
            </div>
          )}
        </div>

        {queryError && <div className="error-bar">{queryError}</div>}

        <form className="query-bar" onSubmit={handleQuery}>
          <input
            type="text"
            placeholder="Type your question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !query.trim()}>
            Send
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>AI Query Assistant</h1>
        <div className="tabs">
          <button
            className={authView === 'login' ? 'active' : ''}
            onClick={() => { setAuthView('login'); setAuthError(''); }}
          >
            Login
          </button>
          <button
            className={authView === 'register' ? 'active' : ''}
            onClick={() => { setAuthView('register'); setAuthError(''); }}
          >
            Register
          </button>
        </div>
        <form onSubmit={handleAuth}>
          <input
            type="text"
            placeholder="Username"
            value={formUser}
            onChange={(e) => setFormUser(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formPass}
            onChange={(e) => setFormPass(e.target.value)}
            required
          />
          {authError && <p className="err">{authError}</p>}
          <button type="submit">
            {authView === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
