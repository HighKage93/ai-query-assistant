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
      <div className="w-full max-w-3xl h-screen flex flex-col px-6 py-5">
        <header className="flex justify-between items-center pb-4 border-b border-[#1f1f1f] mb-3 shrink-0">
          <h1 className="text-lg font-semibold text-white">AI Query Assistant</h1>
          <div className="flex items-center gap-3 text-[#888] text-sm">
            <span>
              Hello, <strong className="text-neutral-300">{username}</strong>
            </span>
            <button
              className="px-3.5 py-1.5 bg-transparent border border-[#333] rounded-md text-[#888] text-sm cursor-pointer transition-all hover:bg-[#1f1f1f] hover:text-[#ccc]"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 py-2 scrollbar-thin">
          {messages.length === 0 && (
            <p className="text-center text-[#3a3a3a] m-auto text-base">Ask me anything...</p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 max-w-[78%] ${
                msg.role === 'user' ? 'self-end items-end' : 'self-start'
              }`}
            >
              <span className="text-[0.7rem] text-[#555] uppercase tracking-widest">
                {msg.role === 'user' ? 'You' : 'AI'}
              </span>
              <p
                className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-[12px_12px_4px_12px]'
                    : 'bg-[#1e1e1e] text-[#d0d0d0] rounded-[12px_12px_12px_4px]'
                }`}
              >
                {msg.content}
              </p>
            </div>
          ))}
          {loading && (
            <div className="flex flex-col gap-1 max-w-[78%] self-start">
              <span className="text-[0.7rem] text-[#555] uppercase tracking-widest">AI</span>
              <p className="px-4 py-3 text-sm leading-relaxed bg-[#1e1e1e] text-[#555] italic rounded-[12px_12px_12px_4px]">
                Thinking...
              </p>
            </div>
          )}
        </div>

        {queryError && (
          <div className="px-4 py-2.5 bg-[#2d1010] border border-[#5c1f1f] rounded-lg text-red-400 text-sm mb-2 shrink-0">
            {queryError}
          </div>
        )}

        <form className="flex gap-2 pt-3.5 border-t border-[#1f1f1f] mt-2 shrink-0" onSubmit={handleQuery}>
          <input
            className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-neutral-200 text-sm outline-none focus:border-indigo-600 transition-colors"
            type="text"
            placeholder="Type your question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button
            className="px-5 py-3 bg-indigo-600 text-white border-none rounded-xl cursor-pointer text-sm transition-colors hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            type="submit"
            disabled={loading || !query.trim()}
          >
            Send
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-10 w-full max-w-sm flex flex-col gap-5">
        <h1 className="text-xl font-semibold text-white text-center">AI Query Assistant</h1>
        <div className="flex gap-2">
          <button
            className={`flex-1 py-2.5 border rounded-lg text-sm cursor-pointer transition-all ${
              authView === 'login'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-[#252525] border-[#333] text-[#777]'
            }`}
            onClick={() => { setAuthView('login'); setAuthError(''); }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2.5 border rounded-lg text-sm cursor-pointer transition-all ${
              authView === 'register'
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-[#252525] border-[#333] text-[#777]'
            }`}
            onClick={() => { setAuthView('register'); setAuthError(''); }}
          >
            Register
          </button>
        </div>
        <form className="flex flex-col gap-3" onSubmit={handleAuth}>
          <input
            className="px-3.5 py-3 bg-[#252525] border border-[#333] rounded-lg text-neutral-200 text-sm outline-none focus:border-indigo-600 transition-colors w-full"
            type="text"
            placeholder="Username"
            value={formUser}
            onChange={(e) => setFormUser(e.target.value)}
            required
          />
          <input
            className="px-3.5 py-3 bg-[#252525] border border-[#333] rounded-lg text-neutral-200 text-sm outline-none focus:border-indigo-600 transition-colors w-full"
            type="password"
            placeholder="Password"
            value={formPass}
            onChange={(e) => setFormPass(e.target.value)}
            required
          />
          {authError && <p className="text-red-400 text-sm">{authError}</p>}
          <button
            className="py-3 bg-indigo-600 text-white border-none rounded-lg text-base cursor-pointer transition-colors hover:bg-indigo-700 w-full"
            type="submit"
            data-testid="auth-submit"
          >
            {authView === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
