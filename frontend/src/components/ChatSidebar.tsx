import { useEffect, useRef } from 'react';

export interface ChatMeta {
  _id: string;
  title: string;
  updatedAt: string;
}

interface Props {
  chats: ChatMeta[];
  currentChatId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  loading: boolean;
}

function timeLabel(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function ChatSidebar({ chats, currentChatId, onSelect, onNew, onDelete, loading }: Props) {
  const deleteRef = useRef<string | null>(null);

  useEffect(() => { deleteRef.current = null; }, [chats]);

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r border-gray-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111] h-full">
      <div className="p-3 border-b border-gray-200 dark:border-[#1f1f1f]">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
        {loading && (
          <p className="text-center text-gray-400 dark:text-neutral-600 text-xs py-4">Loading...</p>
        )}
        {!loading && chats.length === 0 && (
          <p className="text-center text-gray-400 dark:text-neutral-600 text-xs py-4">No chats yet</p>
        )}
        {chats.map((chat) => (
          <div
            key={chat._id}
            className={`group flex items-center gap-1 px-2 py-1.5 mx-1 rounded-lg cursor-pointer transition-colors ${
              chat._id === currentChatId
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                : 'hover:bg-gray-100 dark:hover:bg-[#1a1a1a] text-gray-700 dark:text-neutral-300'
            }`}
            onClick={() => onSelect(chat._id)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{chat.title}</p>
              <p className="text-[0.65rem] text-gray-400 dark:text-neutral-600">{timeLabel(chat.updatedAt)}</p>
            </div>
            <button
              className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:text-neutral-600 dark:hover:text-red-400 transition-all p-0.5 rounded"
              onClick={(e) => { e.stopPropagation(); onDelete(chat._id); }}
              title="Delete chat"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
