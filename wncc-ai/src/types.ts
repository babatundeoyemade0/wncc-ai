export type ReactionType = 'like' | 'love' | 'amen' | 'insightful' | 'haha' | 'wow';

export interface Reaction {
  userId: string;
  userName: string;
  type: ReactionType;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl?: string;
  role: 'super_admin' | 'admin' | 'user';
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  isBanned?: boolean;
  banReason?: string;
  createdAt: string;
  friends: string[];
  followers?: string[];
  following?: string[];
  savedPostIds?: string[];
  online?: boolean;
  lastActive?: string;
  friendshipStatus?: 'none' | 'friends' | 'pending_sent' | 'pending_received';
  pendingRequestId?: string | null;
}

export interface Topic {
  id: string;
  title: string;
  subject: string;
  category: string;
  explanation: string;
  keywords: string[];
  bibleReferences: string[];
  notes: string;
  studyMaterial: string;
  searchTerms: string[];
  createdAt: string;
  updatedAt?: string;
  authorId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  imageUrl?: string;
  bibleReferences?: string[];
  relatedTopics?: string[];
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface PostCommentReply {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes?: string[];
}

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes?: string[];
  replies?: PostCommentReply[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  imageUrl?: string;
  feeling?: string;
  likes: string[]; // backward compatible
  reactions?: Reaction[];
  comments: PostComment[];
  sharesCount?: number;
  groupId?: string;
  groupName?: string;
  savedBy?: string[];
  createdAt: string;
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  mediaUrl: string;
  caption?: string;
  createdAt: string;
  expiresAt: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: 'image' | 'video' | 'audio' | 'document' | 'file';
  url: string;
  mimeType: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  coverUrl: string;
  avatarUrl: string;
  privacy: 'public' | 'private';
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  memberCount?: number;
  isLocked?: boolean;
  createdAt: string;
  recentPostCount?: number;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  attachments?: MessageAttachment[];
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUser: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: MessageAttachment[];
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  createdAt: string;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'friend_request' | 'friend_accepted' | 'like' | 'reaction' | 'comment' | 'reply' | 'announcement' | 'group_invite';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  important: boolean;
}

export interface PlatformBranding {
  siteName: string;
  logoUrl?: string;
  tagline?: string;
  primaryColor?: string;
  announcementBanner?: string;
  rules: string[];
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'post' | 'comment' | 'message' | 'user' | 'group';
  targetId: string;
  targetSummary?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  actionTaken?: string;
}

export interface Appeal {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  reason: string;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AdminLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  timestamp: string;
}

export interface PlatformStats {
  totalUsers: number;
  totalTopics: number;
  totalPosts: number;
  totalGroups: number;
  totalConversations: number;
  totalQuestions: number;
  categoriesCount: number;
  totalReports?: number;
  totalAppeals?: number;
}
