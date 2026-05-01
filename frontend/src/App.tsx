import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { login as apiLogin, register as apiRegister, streamQuery, getChats, getChat, deleteChat } from './api';
import ChatSidebar, { ChatMeta } from './components/ChatSidebar';
import MarkdownMessage from './components/MarkdownMessage';
import EmptyState from './components/EmptyState';
import Portfolio from './pages/Portfolio';

type AuthView = 'login' | 'register';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  duration?: number;
}

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

// ── Auth page ────────────────────────────────────────────────────────────────

function AuthPage({ onAuth }: { onAuth: (token: string, username: string) => void }) {
  const [view, setView] = useState<AuthView>('login');
  const [formUser, setFormUser] = useState('');
  const [formPass, setFormPass] = useState('');
  const [error, setError] = useState('');
  const { dark, toggle } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fn = view === 'login' ? apiLogin : apiRegister;
    const data = await fn(formUser, formPass);
    if (data.error) { setError(data.error); return; }
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    onAuth(data.token, data.username);
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-gray-50 dark:bg-[#0d0d0d]">
      <button
        onClick={toggle}
        className="fixed top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-[#252525] transition-colors text-sm"
        title="Toggle theme"
      >
        {dark ? '☀️' : '🌙'}
      </button>

      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-10 w-full max-w-sm flex flex-col gap-5 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-center">AI Query Assistant</h1>

        <div className="flex gap-2">
            {(['login', 'register'] as AuthView[]).map((v) => (
            <button
              key={v}
              className={`flex-1 py-2.5 border rounded-lg text-sm cursor-pointer transition-all ${
                view === v
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-[#252525] border-gray-200 dark:border-[#333] text-gray-500 dark:text-[#777]'
              }`}
              onClick={() => { setView(v); setError(''); }}
            >
              {v === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <input
            className="px-3.5 py-3 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-neutral-200 text-sm outline-none focus:border-indigo-500 transition-colors w-full"
            type="text"
            placeholder="Username"
            value={formUser}
            onChange={(e) => setFormUser(e.target.value)}
            required
          />
          <input
            className="px-3.5 py-3 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#333] rounded-lg text-gray-900 dark:text-neutral-200 text-sm outline-none focus:border-indigo-500 transition-colors w-full"
            type="password"
            placeholder="Password"
            value={formPass}
            onChange={(e) => setFormPass(e.target.value)}
            required
          />
          {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}
          <button
            className="py-3 bg-indigo-600 text-white border-none rounded-lg text-base cursor-pointer transition-colors hover:bg-indigo-700 w-full"
            type="submit"
            data-testid="auth-submit"
          >
            {view === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Chat page ────────────────────────────────────────────────────────────────

function ChatPage({ token, username, onLogout }: { token: string; username: string; onLogout: () => void }) {
  const { chatId: urlChatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(urlChatId ?? null);
  const [chats, setChats] = useState<ChatMeta[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { dark, toggle } = useTheme();

  const guardAuth = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn();
      } catch (err: unknown) {
        if ((err as { status?: number }).status === 401) { onLogout(); return null; }
        return null;
      }
    },
    [onLogout],
  );

  const fetchChats = useCallback(async () => {
    setChatsLoading(true);
    const data = await guardAuth(() => getChats(token));
    setChatsLoading(false);
    if (Array.isArray(data)) setChats(data);
  }, [token, guardAuth]);

  // Load chat from URL on mount or when URL chatId changes
  useEffect(() => {
    if (!urlChatId) {
      setMessages([]);
      setCurrentChatId(null);
      return;
    }
    if (urlChatId === currentChatId) return;
    guardAuth(() => getChat(urlChatId, token)).then((data) => {
      if (data?.messages) {
        setMessages(data.messages);
        setCurrentChatId(urlChatId);
        setQueryError('');
      }
    });
  }, [urlChatId]); // intentionally omits guardAuth/token/currentChatId to only fire on URL change

  useEffect(() => { fetchChats(); }, [fetchChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSelectChat = (id: string) => navigate(`/chat/${id}`);

  const handleNewChat = () => navigate('/');

  const handleDeleteChat = async (id: string) => {
    await guardAuth(() => deleteChat(id, token));
    if (id === currentChatId) navigate('/');
    fetchChats();
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setQuery('');
    setQueryError('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: trimmed },
      { role: 'assistant', content: '' },
    ]);
    setLoading(true);

    await streamQuery(
      trimmed,
      currentChatId,
      token,
      (chunk) => {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + chunk };
          return next;
        });
      },
      (duration, newChatId) => {
        setLoading(false);
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], duration };
          return next;
        });
        if (newChatId) {
          setCurrentChatId(newChatId);
          fetchChats();
          // Update URL without re-triggering the load effect
          if (!urlChatId) navigate(`/chat/${newChatId}`, { replace: true });
        }
      },
      (error) => {
        setLoading(false);
        setMessages((prev) => prev.slice(0, -1));
        if (error.toLowerCase().includes('token')) { onLogout(); return; }
        setQueryError(error);
      },
    );
  };

  return (
    <div className="flex w-full h-screen bg-gray-50 dark:bg-[#0d0d0d] overflow-hidden">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelect={handleSelectChat}
        onNew={handleNewChat}
        onDelete={handleDeleteChat}
        loading={chatsLoading}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex justify-between items-center px-5 py-3 border-b border-gray-200 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] shrink-0">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">AI Query Assistant</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-1.5 rounded-lg text-gray-400 dark:text-neutral-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors text-sm"
              title="Toggle theme"
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <span className="text-sm text-gray-500 dark:text-[#888]">
              Hello, <strong className="text-gray-700 dark:text-neutral-300">{username}</strong>
            </span>
            <button
              className="px-3 py-1.5 bg-transparent border border-gray-200 dark:border-[#333] rounded-md text-gray-500 dark:text-[#888] text-sm cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-[#1f1f1f] hover:text-gray-700 dark:hover:text-[#ccc]"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 flex flex-col gap-4">
          {messages.length === 0 && !loading && <EmptyState />}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 max-w-[78%] ${
                msg.role === 'user' ? 'self-end items-end' : 'self-start'
              }`}
            >
              <span className="text-[0.65rem] text-gray-400 dark:text-[#555] uppercase tracking-widest">
                {msg.role === 'user' ? 'You' : 'AI'}
              </span>

              <div className="relative group">
                <div
                  className={`px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-[12px_12px_4px_12px]'
                      : 'bg-gray-100 dark:bg-[#1e1e1e] text-gray-800 dark:text-[#d0d0d0] rounded-[12px_12px_12px_4px]'
                  } ${msg.role === 'assistant' && !msg.content ? 'min-w-[60px]' : ''}`}
                >
                  {msg.role === 'assistant' ? (
                    msg.content ? (
                      <MarkdownMessage content={msg.content} isDark={dark} />
                    ) : (
                      <span className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-neutral-500 animate-bounce [animation-delay:300ms]" />
                      </span>
                    )
                  ) : (
                    msg.content
                  )}
                </div>

                {msg.role === 'assistant' && msg.content && (
                  <button
                    onClick={() => handleCopy(msg.content, i)}
                    className="absolute -top-1 -right-8 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 dark:text-neutral-600 hover:text-gray-600 dark:hover:text-neutral-400 text-xs"
                    title="Copy"
                  >
                    {copiedIndex === i ? '✓' : '⎘'}
                  </button>
                )}
              </div>

              {msg.role === 'assistant' && msg.duration && (
                <span className="text-[0.6rem] text-gray-300 dark:text-neutral-700">
                  {(msg.duration / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          ))}

          {queryError && (
            <div className="px-4 py-2.5 bg-red-50 dark:bg-[#2d1010] border border-red-200 dark:border-[#5c1f1f] rounded-lg text-red-500 dark:text-red-400 text-sm self-stretch shrink-0">
              {queryError}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          className="flex gap-2 px-5 py-3 border-t border-gray-200 dark:border-[#1f1f1f] bg-white dark:bg-[#0d0d0d] shrink-0"
          onSubmit={handleQuery}
        >
          <input
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-xl text-gray-900 dark:text-neutral-200 text-sm outline-none focus:border-indigo-500 transition-colors"
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
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────────────

function AuthedApp() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || '');

  const handleAuth = (t: string, u: string) => { setToken(t); setUsername(u); };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken('');
    setUsername('');
  };

  if (!token) return <AuthPage onAuth={handleAuth} />;

  return (
    <Routes>
      <Route path="/" element={<ChatPage token={token} username={username} onLogout={handleLogout} />} />
      <Route path="/chat/:chatId" element={<ChatPage token={token} username={username} onLogout={handleLogout} />} />
      <Route path="*" element={<ChatPage token={token} username={username} onLogout={handleLogout} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/*" element={<AuthedApp />} />
    </Routes>
  );
}
