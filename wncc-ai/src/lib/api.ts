import {
  User,
  Topic,
  Conversation,
  ChatMessage,
  Post,
  Story,
  Group,
  GroupMessage,
  FriendRequest,
  DirectMessage,
  Notification,
  Announcement,
  PlatformStats,
  ReactionType,
  MessageAttachment,
  PlatformBranding,
  Report,
  Appeal,
  AdminLog
} from '../types';

const TOKEN_KEY = 'wncc_auth_token';
const GUEST_ID_KEY = 'wncc_guest_session_id';

export function getGuestId(): string {
  let gid = localStorage.getItem(GUEST_ID_KEY);
  if (!gid) {
    gid = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem(GUEST_ID_KEY, gid);
  }
  return gid;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const guestId = getGuestId();
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else {
    headers.set('x-guest-id', guestId);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = 'Something went wrong. Please try again.';
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error;
      }
    } catch (_) {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async register(data: { email: string; username: string; displayName: string; password: string }) {
    return request<{ token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async login(data: { identifier: string; password: string }) {
    return request<{ token: string; user: User; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  async updateProfile(data: { displayName?: string; username?: string; bio?: string; avatarUrl?: string; coverUrl?: string }) {
    return request<{ user: User; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async updateActiveStatus() {
    return request<{ success: boolean }>('/api/users/active', { method: 'POST' });
  },

  // Gallery Upload
  async uploadImage(dataUrl: string, filename?: string) {
    return request<{ url: string; message: string }>('/api/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl, filename })
    });
  },

  async uploadFiles(files: Array<{ name: string; size: number; mimeType: string; dataUrl: string }>) {
    return request<{ attachments: MessageAttachment[]; message: string }>('/api/upload-file', {
      method: 'POST',
      body: JSON.stringify({ files })
    });
  },

  // Stories
  async getStories() {
    return request<{ stories: Story[] }>('/api/stories');
  },

  async createStory(mediaUrl: string, caption?: string) {
    return request<{ story: Story; message: string }>('/api/stories', {
      method: 'POST',
      body: JSON.stringify({ mediaUrl, caption })
    });
  },

  async deleteStory(id: string) {
    return request<{ message: string }>(`/api/stories/${id}`, { method: 'DELETE' });
  },

  // Community Posts & Reactions
  async getPosts(groupId?: string) {
    const url = groupId ? `/api/community/posts?groupId=${groupId}` : '/api/community/posts';
    return request<{ posts: Post[] }>(url);
  },

  async createPost(content: string, imageUrl?: string, feeling?: string, groupId?: string) {
    return request<{ post: Post; message: string }>('/api/community/posts', {
      method: 'POST',
      body: JSON.stringify({ content, imageUrl, feeling, groupId })
    });
  },

  async reactToPost(postId: string, type: ReactionType) {
    return request<{ reactions: any[]; likes: string[] }>(`/api/community/posts/${postId}/react`, {
      method: 'POST',
      body: JSON.stringify({ type })
    });
  },

  async likePost(postId: string) {
    return request<{ reactions: any[]; likes: string[]; liked: boolean }>(`/api/community/posts/${postId}/like`, {
      method: 'POST'
    });
  },

  async addComment(postId: string, content: string) {
    return request<{ comment: any }>(`/api/community/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  async addReply(postId: string, commentId: string, content: string) {
    return request<{ reply: any }>(`/api/community/posts/${postId}/comments/${commentId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  async savePost(postId: string) {
    return request<{ saved: boolean; savedPostIds: string[] }>(`/api/community/posts/${postId}/save`, {
      method: 'POST'
    });
  },

  async sharePost(postId: string) {
    return request<{ sharesCount: number }>(`/api/community/posts/${postId}/share`, {
      method: 'POST'
    });
  },

  async deletePost(postId: string) {
    return request<{ message: string }>(`/api/community/posts/${postId}`, {
      method: 'DELETE'
    });
  },

  // Groups (with RBAC: Super Admin > Group Owner > Group Admin > Member)
  async getGroups() {
    return request<{ groups: Group[] }>('/api/groups');
  },

  async getGroup(id: string) {
    return request<{ group: Group; members: any[]; posts: Post[] }>(`/api/groups/${id}`);
  },

  async createGroup(data: { name: string; description: string; category?: string; coverUrl?: string; avatarUrl?: string; privacy?: 'public' | 'private' }) {
    return request<{ group: Group; message: string }>('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateGroup(id: string, data: Partial<Group>) {
    return request<{ group: Group; message: string }>(`/api/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async addGroupAdmin(groupId: string, userId: string) {
    return request<{ success: boolean; adminIds: string[]; message: string }>(`/api/groups/${groupId}/admins`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  async removeGroupAdmin(groupId: string, userId: string) {
    return request<{ success: boolean; adminIds: string[]; message: string }>(`/api/groups/${groupId}/admins/${userId}`, {
      method: 'DELETE'
    });
  },

  async transferGroupOwnership(groupId: string, newOwnerId: string) {
    return request<{ success: boolean; group: Group; message: string }>(`/api/groups/${groupId}/transfer-ownership`, {
      method: 'POST',
      body: JSON.stringify({ newOwnerId })
    });
  },

  async removeGroupMember(groupId: string, userId: string) {
    return request<{ success: boolean; memberCount: number; message: string }>(`/api/groups/${groupId}/members/${userId}`, {
      method: 'DELETE'
    });
  },

  async deleteGroup(groupId: string) {
    return request<{ success: boolean; message: string }>(`/api/groups/${groupId}`, {
      method: 'DELETE'
    });
  },

  async joinGroup(id: string) {
    return request<{ success: boolean; memberCount: number }>(`/api/groups/${id}/join`, {
      method: 'POST'
    });
  },

  async leaveGroup(id: string) {
    return request<{ success: boolean; memberCount: number }>(`/api/groups/${id}/leave`, {
      method: 'POST'
    });
  },

  async getGroupChat(groupId: string) {
    return request<{ messages: GroupMessage[] }>(`/api/groups/${groupId}/chat`);
  },

  async sendGroupChat(groupId: string, content: string, attachments?: MessageAttachment[], replyTo?: any) {
    return request<{ message: GroupMessage }>(`/api/groups/${groupId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments, replyTo })
    });
  },

  async deleteGroupChatMessage(groupId: string, messageId: string) {
    return request<{ success: boolean; message: string }>(`/api/groups/${groupId}/chat/${messageId}`, {
      method: 'DELETE'
    });
  },

  // Friends, Following & Suggested
  async getSuggestedFriends() {
    return request<{ suggested: any[] }>('/api/friends/suggested');
  },

  async followUser(userId: string) {
    return request<{ following: boolean; followersCount: number }>(`/api/users/${userId}/follow`, {
      method: 'POST'
    });
  },

  async getMemories() {
    return request<{ memories: Post[] }>('/api/memories');
  },

  async getUserProfile(userIdOrUsername: string) {
    return request<{
      user: User;
      posts: Post[];
      friends: Array<{ id: string; displayName: string; username: string; avatarUrl: string }>;
    }>(`/api/users/${userIdOrUsername}`);
  },

  async sendFriendRequest(targetUserId: string) {
    return request<{ message: string; request: any }>(`/api/friends/request/${targetUserId}`, {
      method: 'POST'
    });
  },

  async getFriendRequests() {
    return request<{ requests: FriendRequest[] }>('/api/friends/requests');
  },

  async respondFriendRequest(requestId: string, action: 'accept' | 'decline') {
    return request<{ message: string }>(`/api/friends/respond/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
  },

  // Direct Messages (Upgraded with attachments, reply, delete)
  async getDirectMessages(otherUserId: string) {
    return request<{ messages: DirectMessage[] }>(`/api/messages/${otherUserId}`);
  },

  async sendDirectMessage(otherUserId: string, content: string, attachments?: MessageAttachment[], replyTo?: any) {
    return request<{ message: DirectMessage }>(`/api/messages/${otherUserId}`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments, replyTo })
    });
  },

  async deleteDirectMessage(messageId: string) {
    return request<{ success: boolean; message: string }>(`/api/messages/${messageId}`, {
      method: 'DELETE'
    });
  },

  async getMessageThreads() {
    return request<{
      threads: Array<{
        user: { id: string; displayName: string; username: string; avatarUrl: string; lastActive?: string };
        lastMessage: DirectMessage;
        unreadCount: number;
      }>;
    }>('/api/messages-threads');
  },

  // Topics & Knowledge
  async getTopics(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (search) params.set('search', search);
    return request<{ topics: Topic[]; total: number }>(`/api/topics?${params.toString()}`);
  },

  async getTopic(id: string) {
    return request<{ topic: Topic }>(`/api/topics/${id}`);
  },

  async getCategories() {
    return request<{ categories: string[] }>('/api/categories');
  },

  async getAnnouncements() {
    return request<{ announcements: Announcement[] }>('/api/announcements');
  },

  // AI Chat
  async getConversations() {
    return request<{ conversations: Conversation[] }>('/api/conversations');
  },

  async getConversation(id: string) {
    return request<{ conversation: Conversation }>(`/api/conversations/${id}`);
  },

  async createConversation(title?: string) {
    return request<{ conversation: Conversation }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title })
    });
  },

  async renameConversation(id: string, title: string) {
    return request<{ conversation: Conversation }>(`/api/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title })
    });
  },

  async deleteConversation(id: string) {
    return request<{ message: string }>(`/api/conversations/${id}`, {
      method: 'DELETE'
    });
  },

  async sendMessage(conversationId: string, content: string, promptMode?: 'standard' | 'simple' | 'exam' | 'reasoning', imageUrl?: string) {
    return request<{
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
      conversation: Conversation;
    }>(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, promptMode, imageUrl })
    });
  },

  async sendMessageStream(
    conversationId: string,
    content: string,
    promptMode: 'standard' | 'simple' | 'exam' | 'reasoning' = 'standard',
    imageUrl?: string,
    onChunk?: (chunk: string) => void,
    onDone?: (data: { assistantMessage: ChatMessage; conversation: Conversation }) => void,
    signal?: AbortSignal
  ) {
    const token = getToken();
    const guestId = getGuestId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['x-guest-id'] = guestId;
    }

    const response = await fetch(`/api/conversations/${conversationId}/messages/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content, promptMode, imageUrl }),
      signal
    });

    if (!response.ok) {
      let errText = 'Failed to generate response.';
      try {
        const errJson = await response.json();
        if (errJson.error) errText = errJson.error;
      } catch (_) {}
      throw new Error(errText);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported.');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.chunk && onChunk) {
              onChunk(parsed.chunk);
            }
            if (parsed.done && onDone) {
              onDone(parsed);
            }
          } catch (_) {}
        }
      }
    }
  },

  // Notifications
  async getNotifications() {
    return request<{ notifications: Notification[] }>('/api/notifications');
  },

  async markNotificationRead(id: string) {
    return request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'POST'
    });
  },

  async markAllNotificationsRead() {
    return request<{ success: boolean }>('/api/notifications/read-all', {
      method: 'POST'
    });
  },

  // Search
  async search(query: string) {
    return request<{ topics: Topic[]; posts: Post[]; users: User[]; groups: Group[] }>(`/api/search?q=${encodeURIComponent(query)}`);
  },

  // Admin
  async getAdminStats() {
    return request<{ stats: PlatformStats }>('/api/admin/stats');
  },

  async addAdminTopic(data: any) {
    return request<{ topic: Topic; message: string }>('/api/admin/topics', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateAdminTopic(id: string, data: any) {
    return request<{ topic: Topic; message: string }>(`/api/admin/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminTopic(id: string) {
    return request<{ message: string }>(`/api/admin/topics/${id}`, {
      method: 'DELETE'
    });
  },

  async addAdminCategory(name: string) {
    return request<{ categories: string[]; message: string }>('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  },

  async deleteAdminCategory(name: string) {
    return request<{ categories: string[]; message: string }>(`/api/admin/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE'
    });
  },

  async addAdminAnnouncement(data: { title: string; content: string; important: boolean }) {
    return request<{ announcement: Announcement; message: string }>('/api/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deleteAdminAnnouncement(id: string) {
    return request<{ message: string }>(`/api/admin/announcements/${id}`, {
      method: 'DELETE'
    });
  },

  async getAdminSettings() {
    return request<{ settings: { customAiInstructions: string } }>('/api/admin/settings');
  },

  async saveAdminSettings(customAiInstructions: string) {
    return request<{ settings: any; message: string }>('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ customAiInstructions })
    });
  },

  // Branding & Rules
  async getBranding() {
    return request<{ branding: PlatformBranding }>('/api/branding');
  },

  async getRules() {
    return request<{ rules: string[] }>('/api/rules');
  },

  async updateAdminBranding(data: Partial<PlatformBranding>) {
    return request<{ branding: PlatformBranding; message: string }>('/api/admin/branding', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  // Super Admin: User Management & Moderation
  async getAdminUsers() {
    return request<{ users: User[] }>('/api/admin/users');
  },

  async banUser(userId: string, ban: boolean, reason?: string) {
    return request<{ success: boolean; user: Partial<User>; message: string }>(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      body: JSON.stringify({ ban, reason })
    });
  },

  async deleteUser(userId: string) {
    return request<{ success: boolean; message: string }>(`/api/admin/users/${userId}`, {
      method: 'DELETE'
    });
  },

  async updateUserRole(userId: string, role: 'user' | 'admin' | 'super_admin') {
    return request<{ success: boolean; user: Partial<User>; message: string }>(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  },

  // Reports
  async submitReport(data: { targetType: 'post' | 'comment' | 'message' | 'user' | 'group'; targetId: string; targetSummary?: string; reason: string; details?: string }) {
    return request<{ report: Report; message: string }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminReports() {
    return request<{ reports: Report[] }>('/api/admin/reports');
  },

  async resolveReport(id: string, status: 'resolved' | 'dismissed', actionTaken?: string) {
    return request<{ report: Report; message: string }>(`/api/admin/reports/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status, actionTaken })
    });
  },

  // Appeals
  async submitAppeal(data: { userName: string; userEmail: string; reason: string; details: string; userId?: string }) {
    return request<{ appeal: Appeal; message: string }>('/api/appeals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminAppeals() {
    return request<{ appeals: Appeal[] }>('/api/admin/appeals');
  },

  async reviewAppeal(id: string, status: 'approved' | 'rejected') {
    return request<{ appeal: Appeal; message: string }>(`/api/admin/appeals/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  // Admin Activity Logs
  async getAdminLogs() {
    return request<{ logs: AdminLog[] }>('/api/admin/logs');
  }
};
