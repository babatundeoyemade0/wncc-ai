import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Topic, Announcement, Post } from '../../types';
import {
  Sparkles,
  BookOpen,
  Users,
  GraduationCap,
  Megaphone,
  ArrowRight,
  BookMarked,
  ShieldCheck,
  ChevronRight,
  Lightbulb,
  FileCheck
} from 'lucide-react';

interface HomeViewProps {
  onNavigateTab: (tab: string) => void;
  onSelectTopic: (topic: Topic) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateTab, onSelectTopic }) => {
  const { user, openAuthModal } = useAuth();

  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [topRes, annRes, postRes] = await Promise.all([
        api.getTopics(),
        api.getAnnouncements(),
        api.getPosts()
      ]);
      setRecentTopics(topRes.topics.slice(0, 3));
      setAnnouncements(annRes.announcements.slice(0, 2));
      setCommunityPosts(postRes.posts.slice(0, 2));
    } catch (err) {
      console.error('Failed to load home data:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12 space-y-8">
      {/* Hero Section */}
      <section className="relative rounded-3xl bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 text-white p-6 sm:p-10 shadow-lg overflow-hidden border border-stone-800">
        <div className="absolute right-0 top-0 translate-x-16 -translate-y-16 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-200 text-xs font-semibold">
            <GraduationCap className="w-4 h-4" />
            <span>West Nigeria Christian College Academic AI</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold font-serif-heading tracking-tight leading-tight">
            Sound Biblical Scholarship. <br className="hidden sm:inline" />
            <span className="text-amber-300">Intelligent Academic Aid.</span>
          </h1>

          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-xl">
            Welcome to WNCC AI — the official research, theological study, and collegiate community platform. Formulate examination answers, examine Scripture in historical context, and interact with fellow scholars.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('chat')}
              className="px-6 py-3 bg-amber-800 hover:bg-amber-750 active:bg-amber-900 text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Launch WNCC AI Chat</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('topics')}
              className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-2xl text-xs sm:text-sm font-semibold transition"
            >
              Explore Knowledge Repository
            </button>
          </div>
        </div>
      </section>

      {/* College Announcements Banner */}
      {announcements.length > 0 && (
        <section className="bg-amber-50/70 border border-amber-200/90 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-amber-800" />
              <span>College Announcements</span>
            </h2>
            <span className="text-[10px] text-amber-800 font-semibold">Dean's Office & Academic Affairs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-stone-900">{ann.title}</h3>
                  {ann.important && (
                    <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[9px] font-bold rounded">
                      Important
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 line-clamp-2">{ann.content}</p>
                <p className="text-[10px] text-stone-400 pt-1">{ann.authorName} · {new Date(ann.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Core Features 3-Column Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: AI Chat Assistant */}
        <div
          onClick={() => onNavigateTab('chat')}
          className="bg-white border border-stone-200 hover:border-amber-400 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-900 text-amber-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-serif-heading text-stone-900 group-hover:text-amber-900 transition-colors">
              Theological AI Chat
            </h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Conversational assistant trained on collegiate Christian theology, Biblical interpretation, Church history, sermon structuring, and exam revision.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center text-xs font-semibold text-amber-900">
            <span>Start studying</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Card 2: Knowledge Repository */}
        <div
          onClick={() => onNavigateTab('topics')}
          className="bg-white border border-stone-200 hover:border-amber-400 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-serif-heading text-stone-900 group-hover:text-amber-900 transition-colors">
              Knowledge Repository
            </h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Access verified WNCC faculty study materials, course outlines, Scripture references, and doctrinal explanations cataloged across 11+ academic categories.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center text-xs font-semibold text-amber-900">
            <span>Browse topics</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        {/* Card 3: Scholar Community */}
        <div
          onClick={() => onNavigateTab('community')}
          className="bg-white border border-stone-200 hover:border-amber-400 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-serif-heading text-stone-900 group-hover:text-amber-900 transition-colors">
              Scholar Community
            </h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Connect with fellow ministerial and degree students, upload images directly from your gallery, participate in study groups, and share insights.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center text-xs font-semibold text-amber-900">
            <span>Join discussion</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </section>

      {/* Featured Topics Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-serif-heading text-stone-900 flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-amber-800" />
              <span>Featured WNCC Knowledge Topics</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Verified theological courses and exam summaries
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('topics')}
            className="text-xs font-semibold text-amber-900 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className="bg-white border border-stone-200 hover:border-amber-300 p-5 rounded-2xl shadow-xs cursor-pointer hover:shadow-sm transition space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-900 rounded text-[10px] font-bold uppercase">
                  {topic.category}
                </span>
                <span className="text-[10px] text-stone-400">{topic.subject}</span>
              </div>
              <h3 className="text-sm font-bold text-stone-900 group-hover:text-amber-900 transition">
                {topic.title}
              </h3>
              <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                {topic.explanation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Values & Trust */}
      <section className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Academic Integrity & Trust</span>
          </div>
          <h3 className="text-xl font-bold font-serif-heading text-stone-900">
            Dedicated to Christ and Ministerial Excellence
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            West Nigeria Christian College has trained preachers, church leaders, and academic scholars across West Africa. WNCC AI augments this legacy through technology grounded in biblical authority.
          </p>
        </div>

        {!user && (
          <button
            onClick={() => openAuthModal('register')}
            className="px-6 py-3.5 bg-amber-900 hover:bg-amber-850 text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-md whitespace-nowrap transition"
          >
            Create Your Account
          </button>
        )}
      </section>
    </div>
  );
};
