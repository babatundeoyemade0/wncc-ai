import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navigation } from './components/Navigation';
import { AuthModal } from './components/Auth/AuthModal';
import { HomeView } from './components/Home/HomeView';
import { ChatView } from './components/Chat/ChatView';
import { TopicsView } from './components/Topics/TopicsView';
import { CommunityView } from './components/Community/CommunityView';
import { GroupsView } from './components/Groups/GroupsView';
import { ProfileView } from './components/Profile/ProfileView';
import { MessagesView } from './components/Messages/MessagesView';
import { NotificationsView } from './components/Notifications/NotificationsView';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { SearchModal } from './components/Search/SearchModal';
import { Topic } from './types';
import { api } from './lib/api';

function MainApp() {
  const { user } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Cross-view navigation parameters
  const [initialTopicForChat, setInitialTopicForChat] = useState<Topic | null>(null);
  const [targetProfileUserId, setTargetProfileUserId] = useState<string | null>(null);
  const [targetMessageUserId, setTargetMessageUserId] = useState<string | null>(null);

  // Polling for counts and activity status
  const refreshCounts = async () => {
    if (!user) {
      setUnreadNotifications(0);
      setUnreadMessages(0);
      return;
    }
    try {
      const [notifRes, threadsRes] = await Promise.all([
        api.getNotifications(),
        api.getMessageThreads()
      ]);
      const unreadN = notifRes.notifications.filter(n => !n.read).length;
      const unreadM = threadsRes.threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0);
      setUnreadNotifications(unreadN);
      setUnreadMessages(unreadM);
      api.updateActiveStatus();
    } catch (_) {
      // ignore
    }
  };

  useEffect(() => {
    refreshCounts();
    const interval = setInterval(refreshCounts, 25000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAskAiAboutTopic = (topic: Topic) => {
    setInitialTopicForChat(topic);
    setCurrentTab('chat');
  };

  const handleViewUserProfile = (userId: string) => {
    setTargetProfileUserId(userId);
    setCurrentTab('profile');
  };

  const handleOpenDirectChat = (otherUserId: string) => {
    setTargetMessageUserId(otherUserId);
    setCurrentTab('messages');
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Navigation Bar */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'profile') {
            setTargetProfileUserId(null);
          }
          setCurrentTab(tab);
        }}
        unreadNotificationsCount={unreadNotifications}
        unreadMessagesCount={unreadMessages}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full">
        {currentTab === 'home' && (
          <HomeView
            onNavigateTab={setCurrentTab}
            onSelectTopic={handleAskAiAboutTopic}
          />
        )}

        {currentTab === 'chat' && (
          <ChatView
            initialTopicContext={initialTopicForChat}
            onClearInitialTopic={() => setInitialTopicForChat(null)}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'topics' && (
          <TopicsView
            onAskAiAboutTopic={handleAskAiAboutTopic}
          />
        )}

        {currentTab === 'community' && (
          <CommunityView
            onViewUserProfile={handleViewUserProfile}
            onNavigateToGroups={() => setCurrentTab('groups')}
          />
        )}

        {currentTab === 'groups' && (
          <GroupsView
            onViewUserProfile={handleViewUserProfile}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            targetUserId={targetProfileUserId}
            onOpenDirectChat={handleOpenDirectChat}
            onNavigateToGroups={() => setCurrentTab('groups')}
          />
        )}

        {currentTab === 'messages' && (
          <MessagesView
            initialChatUserId={targetMessageUserId}
            onClearInitialChatUser={() => setTargetMessageUserId(null)}
          />
        )}

        {currentTab === 'notifications' && (
          <NotificationsView
            onNavigateToTab={setCurrentTab}
            onRefreshCounts={refreshCounts}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectTopic={handleAskAiAboutTopic}
        onSelectUser={handleViewUserProfile}
        onNavigateTab={setCurrentTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
