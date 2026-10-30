import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Notification, FriendRequest } from '../../types';
import {
  Bell,
  CheckCheck,
  UserPlus,
  Heart,
  MessageCircle,
  Megaphone,
  Check,
  X,
  ExternalLink
} from 'lucide-react';

interface NotificationsViewProps {
  onNavigateToTab: (tab: string) => void;
  onRefreshCounts?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onNavigateToTab,
  onRefreshCounts
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const [notifRes, frRes] = await Promise.all([
        api.getNotifications(),
        api.getFriendRequests()
      ]);
      setNotifications(notifRes.notifications);
      setFriendRequests(frRes.requests);
      if (onRefreshCounts) onRefreshCounts();
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      if (onRefreshCounts) onRefreshCounts();
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      if (onRefreshCounts) onRefreshCounts();
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleFriendResponse = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      await api.respondFriendRequest(requestId, action);
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      loadNotifications();
    } catch (err) {
      console.error('Error responding to friend request:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
      case 'friend_accepted':
        return <UserPlus className="w-4 h-4 text-emerald-600" />;
      case 'like':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'comment':
      case 'reply':
        return <MessageCircle className="w-4 h-4 text-amber-600" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-amber-800" />;
      default:
        return <Bell className="w-4 h-4 text-stone-500" />;
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold font-serif-heading text-stone-900">Notifications</h2>
        <p className="text-xs text-stone-500 mt-1">Please sign in to view your academic alerts and community activity.</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif-heading text-stone-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-800" />
            <span>Notifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Academic updates, friend requests, and discussion responses
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Pending Friend Requests Section */}
      {friendRequests.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-amber-800" />
            <span>Pending Friend Requests ({friendRequests.length})</span>
          </h3>

          <div className="space-y-2">
            {friendRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-3.5 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={req.fromUser?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${req.fromUser?.displayName}`}
                    alt=""
                    className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-stone-900">{req.fromUser?.displayName}</h4>
                    <p className="text-[10px] text-stone-400">@{req.fromUser?.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFriendResponse(req.id, 'accept')}
                    className="px-3 py-1.5 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleFriendResponse(req.id, 'decline')}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Stream */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-stone-200 rounded-2xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white border border-stone-200 rounded-3xl p-8">
          <Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">You're all caught up</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            New community responses, college announcements, and messages will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                notif.read
                  ? 'bg-white border-stone-200 text-stone-600'
                  : 'bg-amber-50/50 border-amber-300 shadow-2xs text-stone-900'
              }`}
            >
              <div className="p-2 bg-stone-100 rounded-xl flex-shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-stone-900">{notif.title}</h4>
                  <span className="text-[10px] text-stone-400">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">{notif.message}</p>
              </div>

              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-amber-800 flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
