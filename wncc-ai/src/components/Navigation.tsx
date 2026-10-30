import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { RulesModal } from './RulesModal';
import { AppealModal } from './AppealModal';
import {
  Sparkles,
  BookOpen,
  Users,
  MessageSquare,
  Bell,
  User as UserIcon,
  ShieldAlert,
  Search,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Layers,
  Home,
  ShieldCheck,
  Scale
} from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  unreadNotificationsCount?: number;
  unreadMessagesCount?: number;
  onOpenSearch?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  unreadNotificationsCount = 0,
  unreadMessagesCount = 0,
  onOpenSearch
}) => {
  const { user, logout, openAuthModal, isSuperAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [appealModalOpen, setAppealModalOpen] = useState(false);

  const [siteName, setSiteName] = useState('WNCC AI');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [announcementBanner, setAnnouncementBanner] = useState<string | null>(null);

  useEffect(() => {
    api.getBranding().then(res => {
      if (res.branding) {
        if (res.branding.siteName) setSiteName(res.branding.siteName);
        if (res.branding.logoUrl) setLogoUrl(res.branding.logoUrl);
        if (res.branding.announcementBanner) setAnnouncementBanner(res.branding.announcementBanner);
      }
    }).catch(() => {});
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'AI Chat', icon: Sparkles, highlight: true },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'groups', label: 'Groups', icon: Layers },
    { id: 'topics', label: 'Topics', icon: BookOpen },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMessagesCount },
    { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadNotificationsCount },
  ];

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Optional Global Announcement Ticker */}
      {announcementBanner && (
        <div className="bg-amber-950 text-amber-200 px-4 py-1.5 text-center text-[11px] font-medium border-b border-amber-900 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>{announcementBanner}</span>
        </div>
      )}

      {/* Top Header */}
      <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs ${
        currentTab === 'chat' ? 'hidden md:block' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & College Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTabClick('home')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-900 to-amber-750 flex items-center justify-center text-amber-100 shadow-md group-hover:scale-105 transition-transform overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-heading text-lg font-bold tracking-tight text-stone-900">
                    {siteName}
                  </span>
                  {isSuperAdmin ? (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 bg-amber-200 text-amber-950 border border-amber-400 text-[10px] font-bold rounded uppercase tracking-wider">
                      Super Admin (Owner)
                    </span>
                  ) : user?.isAdmin ? (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold rounded uppercase tracking-wider">
                      Admin
                    </span>
                  ) : null}
                </div>
                <p className="text-[10px] text-stone-500 font-medium tracking-wide hidden sm:block">
                  West Nigeria Christian College
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`relative min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-200' : 'text-stone-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 ? (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-600 text-white text-[10px] font-bold rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}

            {/* Admin Dashboard Tab (Admin & Super Admin only) */}
            {user?.isAdmin && (
              <button
                onClick={() => handleTabClick('admin')}
                className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  currentTab === 'admin'
                    ? 'bg-amber-950 text-amber-200 border border-amber-700 shadow-sm'
                    : 'text-amber-900 hover:bg-amber-50 border border-amber-200'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
              </button>
            )}
          </nav>

          {/* Actions & Profile Area */}
          <div className="flex items-center gap-2">
            {/* Rules Button */}
            <button
              onClick={() => setRulesModalOpen(true)}
              className="p-2 text-stone-500 hover:text-amber-900 hover:bg-stone-100 rounded-xl transition"
              title="Platform Rules & Community Guidelines"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>

            {/* Search Button */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition"
                aria-label="Search"
                title="Search topics, posts, people, and groups"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* User Profile or Sign In */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTabClick('profile')}
                  className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border transition-all ${
                    currentTab === 'profile'
                      ? 'border-amber-800 bg-amber-50 text-amber-900'
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                  }`}
                >
                  <div className="relative">
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-7 h-7 rounded-xl object-cover bg-stone-200 border border-stone-300"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />
                  </div>

                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-stone-900 leading-tight truncate max-w-[110px]">
                      {user.displayName}
                    </p>
                    <p className="text-[10px] text-stone-500 leading-tight">
                      @{user.username}
                    </p>
                  </div>
                </button>

                <button
                  onClick={logout}
                  className="hidden sm:flex p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 bg-amber-900 hover:bg-amber-850 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-700 hover:bg-stone-100 rounded-xl focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => handleTabClick('home')}
                className={`min-h-[44px] flex items-center gap-2 p-3 rounded-xl text-xs font-medium border text-left ${
                  currentTab === 'home' ? 'bg-amber-900 text-white border-amber-900' : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </button>
              <button
                onClick={() => handleTabClick('chat')}
                className={`min-h-[44px] flex items-center gap-2 p-3 rounded-xl text-xs font-medium border text-left ${
                  currentTab === 'chat' ? 'bg-amber-900 text-white border-amber-900' : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>WNCC AI Chat</span>
              </button>
              <button
                onClick={() => handleTabClick('community')}
                className={`min-h-[44px] flex items-center gap-2 p-3 rounded-xl text-xs font-medium border text-left ${
                  currentTab === 'community' ? 'bg-amber-900 text-white border-amber-900' : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Community</span>
              </button>
              <button
                onClick={() => handleTabClick('groups')}
                className={`min-h-[44px] flex items-center gap-2 p-3 rounded-xl text-xs font-medium border text-left ${
                  currentTab === 'groups' ? 'bg-amber-900 text-white border-amber-900' : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Groups</span>
              </button>
              <button
                onClick={() => handleTabClick('topics')}
                className={`min-h-[44px] flex items-center gap-2 p-3 rounded-xl text-xs font-medium border text-left ${
                  currentTab === 'topics' ? 'bg-amber-900 text-white border-amber-900' : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Topics</span>
              </button>
              <button
                onClick={() => handleTabClick('messages')}
                className={`min-h-[44px] flex items-center gap-2 p-3 rounded-xl text-xs font-medium border text-left ${
                  currentTab === 'messages' ? 'bg-amber-900 text-white border-amber-900' : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
                {unreadMessagesCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-full">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabClick('notifications')}
                className={`min-h-[44px] flex items-center gap-2 p-3 rounded-xl text-xs font-medium border text-left ${
                  currentTab === 'notifications' ? 'bg-amber-900 text-white border-amber-900' : 'bg-stone-50 border-stone-200 text-stone-800'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Alerts</span>
                {unreadNotificationsCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-full">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>

            {user?.isAdmin && (
              <button
                onClick={() => handleTabClick('admin')}
                className={`w-full min-h-[44px] flex items-center justify-between p-3 rounded-xl text-xs font-semibold border ${
                  currentTab === 'admin'
                    ? 'bg-amber-950 text-amber-200 border-amber-800'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span>Admin Dashboard</span>
                </div>
                <span className="text-[10px] bg-amber-200 text-amber-950 px-2 py-0.5 rounded font-bold">
                  Authorized
                </span>
              </button>
            )}

            {/* Community Rules & Appeals in mobile menu */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setRulesModalOpen(true);
                }}
                className="p-2.5 bg-stone-50 hover:bg-stone-100 rounded-xl text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-amber-800" />
                <span>Rules & Standards</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAppealModalOpen(true);
                }}
                className="p-2.5 bg-stone-50 hover:bg-stone-100 rounded-xl text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5"
              >
                <Scale className="w-4 h-4 text-amber-800" />
                <span>Submit Appeal</span>
              </button>
            </div>

            {user && (
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => handleTabClick('profile')}
                  className="flex items-center gap-2 text-stone-800 hover:text-amber-900"
                >
                  <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-xl object-cover" />
                  <span className="text-xs font-semibold">{user.displayName}</span>
                </button>
                <button
                  onClick={logout}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 p-2"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar - Facebook-style feed & AI icons */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 px-1 py-1.5 shadow-lg flex items-center justify-around safe-area-bottom">
        <button
          onClick={() => handleTabClick('home')}
          className={`min-h-[44px] flex flex-col items-center justify-center px-2 rounded-xl flex-1 transition ${
            currentTab === 'home' ? 'text-amber-900 font-bold' : 'text-stone-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => handleTabClick('chat')}
          className={`min-h-[44px] flex flex-col items-center justify-center px-2 rounded-xl flex-1 transition ${
            currentTab === 'chat' ? 'text-amber-900 font-bold' : 'text-stone-500'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">WNCC AI</span>
        </button>

        <button
          onClick={() => handleTabClick('community')}
          className={`min-h-[44px] flex flex-col items-center justify-center px-2 rounded-xl flex-1 transition ${
            currentTab === 'community' ? 'text-amber-900 font-bold' : 'text-stone-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Community</span>
        </button>

        <button
          onClick={() => handleTabClick('groups')}
          className={`min-h-[44px] flex flex-col items-center justify-center px-2 rounded-xl flex-1 transition ${
            currentTab === 'groups' ? 'text-amber-900 font-bold' : 'text-stone-500'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Groups</span>
        </button>

        <button
          onClick={() => handleTabClick('messages')}
          className={`min-h-[44px] relative flex flex-col items-center justify-center px-2 rounded-xl flex-1 transition ${
            currentTab === 'messages' ? 'text-amber-900 font-bold' : 'text-stone-500'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Inbox</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 bg-amber-600 rounded-full" />
          )}
        </button>

        <button
          onClick={() => handleTabClick('profile')}
          className={`min-h-[44px] flex flex-col items-center justify-center px-2 rounded-xl flex-1 transition ${
            currentTab === 'profile' ? 'text-amber-900 font-bold' : 'text-stone-500'
          }`}
        >
          {user ? (
            <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-stone-200" />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
          <span className="text-[10px] mt-0.5">Profile</span>
        </button>
      </nav>

      {/* Rules Modal */}
      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        onOpenAppeal={() => setAppealModalOpen(true)}
      />

      {/* Appeal Modal */}
      <AppealModal
        isOpen={appealModalOpen}
        onClose={() => setAppealModalOpen(false)}
      />
    </>
  );
};
