import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Topic, Post, User } from '../../types';
import {
  Search,
  X,
  BookOpen,
  Users,
  MessageSquare,
  FileText,
  ChevronRight
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: Topic) => void;
  onSelectUser: (userId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
  onSelectUser,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ topics: Topic[]; posts: Post[]; users: User[] }>({
    topics: [],
    posts: [],
    users: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ topics: [], posts: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query.trim());
        setResults(res);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults = results.topics.length + results.posts.length + results.users.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-800 flex-shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, Bible scriptures, community posts, or people..."
            className="flex-1 text-sm bg-transparent border-0 focus:outline-none placeholder-stone-400 text-stone-900"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-600 rounded-lg text-xs"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {loading && (
            <div className="text-center py-8 text-xs text-stone-400">Searching WNCC platform...</div>
          )}

          {!loading && query.trim() && totalResults === 0 && (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-stone-800">No results found</h4>
              <p className="text-xs text-stone-400 mt-1">Try another keyword or category name.</p>
            </div>
          )}

          {!query.trim() && (
            <div className="p-4 text-center text-xs text-stone-400">
              Type keywords such as <span className="font-semibold text-stone-600">"Justification"</span>,{' '}
              <span className="font-semibold text-stone-600">"Church History"</span>, or user names to search.
            </div>
          )}

          {/* Topics Results */}
          {results.topics.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                <span>Knowledge Topics ({results.topics.length})</span>
              </h4>
              <div className="space-y-1.5">
                {results.topics.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTopic(t);
                      onClose();
                    }}
                    className="p-3 bg-stone-50 hover:bg-amber-50 rounded-2xl border border-stone-200 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded uppercase">
                          {t.category}
                        </span>
                        <h5 className="text-xs font-bold text-stone-900 group-hover:text-amber-900">
                          {t.title}
                        </h5>
                      </div>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">{t.explanation}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-900" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Results */}
          {results.users.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-800" />
                <span>Scholars & Faculty ({results.users.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.users.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u.id);
                      onClose();
                    }}
                    className="p-2.5 bg-stone-50 hover:bg-amber-50 rounded-2xl border border-stone-200 cursor-pointer transition flex items-center gap-2.5 group"
                  >
                    <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-xl object-cover border border-stone-200" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-stone-900 group-hover:text-amber-900 truncate">
                        {u.displayName}
                      </p>
                      <p className="text-[10px] text-stone-400">@{u.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Results */}
          {results.posts.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-800" />
                <span>Community Posts ({results.posts.length})</span>
              </h4>
              <div className="space-y-1.5">
                {results.posts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigateTab('community');
                      onClose();
                    }}
                    className="p-3 bg-stone-50 hover:bg-amber-50 rounded-2xl border border-stone-200 cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs text-stone-800 line-clamp-2">{p.content}</p>
                      <p className="text-[10px] text-stone-400 mt-1">By {p.authorName} · {new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-900" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
