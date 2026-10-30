import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Topic } from '../../types';
import {
  BookOpen,
  Search,
  Sparkles,
  ExternalLink,
  Tag,
  BookMarked,
  FileText,
  X,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';

interface TopicsViewProps {
  onAskAiAboutTopic: (topic: Topic) => void;
}

export const TopicsView: React.FC<TopicsViewProps> = ({ onAskAiAboutTopic }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [topicsRes, catRes] = await Promise.all([
        api.getTopics(),
        api.getCategories()
      ]);
      setTopics(topicsRes.topics);
      setCategories(['All', ...catRes.categories]);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, cat: string) => {
    setSearchQuery(query);
    setLoading(true);
    try {
      const res = await api.getTopics(cat === 'All' ? undefined : cat, query);
      setTopics(res.topics);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    handleSearch(searchQuery, cat);
  };

  const handleCopyScripture = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden mb-8">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-300 text-xs font-semibold mb-3">
            <BookMarked className="w-3.5 h-3.5" />
            <span>WNCC Knowledge Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-heading tracking-tight">
            Academic & Theological Topics
          </h1>
          <p className="text-stone-300 text-sm mt-2 leading-relaxed">
            Curated ministerial courses, doctrinal syntheses, Church history studies, and exegetical outlines formulated for West Nigeria Christian College scholars.
          </p>

          {/* Search Box */}
          <div className="mt-5 relative max-w-lg">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value, selectedCategory)}
              placeholder="Search by topic title, keyword, or scripture (e.g. Justification, Romans 3)..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-900/80 border border-stone-700 text-white placeholder-stone-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-stone-900 transition"
            />
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Topics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-stone-200 rounded-2xl p-5 animate-pulse space-y-3">
              <div className="h-4 bg-stone-200 rounded w-1/3" />
              <div className="h-6 bg-stone-200 rounded w-3/4" />
              <div className="h-14 bg-stone-100 rounded" />
              <div className="h-4 bg-stone-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-3xl p-8">
          <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No topics available yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No matching topics found for "${searchQuery}". Try a different keyword.`
              : 'The college academic board is curating topics for this category.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => handleSearch('', 'All')}
              className="mt-4 px-4 py-2 bg-amber-900 text-white text-xs font-semibold rounded-xl hover:bg-amber-850"
            >
              Clear Search Filter
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              className="bg-white border border-stone-200 hover:border-amber-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold rounded-md uppercase tracking-wider">
                    {topic.category}
                  </span>
                  <span className="text-[11px] text-stone-400 truncate max-w-[130px]">
                    {topic.subject}
                  </span>
                </div>

                <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-2">
                  {topic.title}
                </h3>

                <p className="text-xs text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                  {topic.explanation}
                </p>

                {/* Bible References Badges */}
                {topic.bibleReferences && topic.bibleReferences.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {topic.bibleReferences.slice(0, 3).map((ref, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] font-medium rounded-md"
                      >
                        {ref}
                      </span>
                    ))}
                    {topic.bibleReferences.length > 3 && (
                      <span className="px-1.5 py-0.5 text-stone-400 text-[10px]">
                        +{topic.bibleReferences.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Quick Action */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-amber-900 font-semibold group-hover:underline flex items-center gap-1">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAskAiAboutTopic(topic);
                  }}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition"
                  title="Ask WNCC AI about this topic"
                >
                  <Sparkles className="w-3 h-3 text-amber-800" />
                  <span>Ask AI</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topic Detail Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-amber-900 to-stone-900 text-white relative">
              <button
                onClick={() => setSelectedTopic(null)}
                className="absolute top-4 right-4 p-2 text-stone-300 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold rounded-md uppercase">
                  {selectedTopic.category}
                </span>
                <span className="text-xs text-stone-300 font-medium">
                  {selectedTopic.subject}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-serif-heading">
                {selectedTopic.title}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              <div>
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  Theological & Academic Summary
                </h4>
                <p className="text-stone-800 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200/80">
                  {selectedTopic.explanation}
                </p>
              </div>

              {/* Bible References */}
              {selectedTopic.bibleReferences && selectedTopic.bibleReferences.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                    <span>Scriptural References (Click to Copy)</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopic.bibleReferences.map((ref, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCopyScripture(ref)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <span>{ref}</span>
                        {copiedRef === ref ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ExternalLink className="w-3 h-3 text-amber-700 opacity-60" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Notes */}
              {selectedTopic.notes && (
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-800" />
                    <span>Collegiate Exam & Study Notes</span>
                  </h4>
                  <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl text-stone-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedTopic.notes}
                  </div>
                </div>
              )}

              {/* Deeper Study Material */}
              {selectedTopic.studyMaterial && (
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                    Supporting Course Material
                  </h4>
                  <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedTopic.studyMaterial}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {selectedTopic.keywords && selectedTopic.keywords.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-stone-400 mr-1" />
                  {selectedTopic.keywords.map((kw, idx) => (
                    <span key={idx} className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedTopic(null)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-200 rounded-xl text-xs font-medium"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const topic = selectedTopic;
                  setSelectedTopic(null);
                  onAskAiAboutTopic(topic);
                }}
                className="px-5 py-2.5 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Discuss with WNCC AI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
