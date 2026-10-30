import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Post, ReactionType } from '../../types';
import { StoriesBar } from './StoriesBar';
import { ReactionPicker, REACTIONS } from './ReactionPicker';
import {
  Users,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Trash2,
  Send,
  X,
  AlertCircle,
  Check,
  CornerDownRight,
  Smile,
  Sparkles,
  UserPlus,
  BookOpen,
  Calendar,
  Layers,
  Flag
} from 'lucide-react';
import { ReportModal } from '../ReportModal';

interface CommunityViewProps {
  onViewUserProfile: (userId: string) => void;
  onNavigateToGroups?: () => void;
}

const FEELINGS = [
  'blessed 🙏',
  'studying Scripture 📖',
  'praying ✝️',
  'thankful ❤️',
  'writing sermon ✍️',
  'inspired 💡',
  'rejoicing ✨'
];

export const CommunityView: React.FC<CommunityViewProps> = ({
  onViewUserProfile,
  onNavigateToGroups
}) => {
  const { user, openAuthModal } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState('');
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [showFeelingsPicker, setShowFeelingsPicker] = useState(false);

  // Gallery image upload
  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Reaction Pickers
  const [hoveredReactionPostId, setHoveredReactionPostId] = useState<string | null>(null);

  // Comments & Replies
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Bookmarks & Share
  const [savedPosts, setSavedPosts] = useState<string[]>([]);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);

  // Sidebar suggested friends & memories
  const [suggestedFriends, setSuggestedFriends] = useState<any[]>([]);
  const [memories, setMemories] = useState<Post[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<string[]>([]);
  const [reportTargetPost, setReportTargetPost] = useState<Post | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [postsRes, friendsRes, memoriesRes] = await Promise.all([
        api.getPosts(),
        user ? api.getSuggestedFriends() : Promise.resolve({ suggested: [] }),
        user ? api.getMemories() : Promise.resolve({ memories: [] })
      ]);
      setPosts(postsRes.posts);
      setSuggestedFriends(friendsRes.suggested || []);
      setMemories(memoriesRes.memories || []);
    } catch (err) {
      console.error('Failed to load community data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setUploadError('Unsupported format. Please select JPG, JPEG, PNG, or WEBP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image size exceeds 15MB limit.');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageDataUrl(reader.result as string);
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      setUploadError('Failed to read image.');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImageDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !selectedImageDataUrl) return;

    if (!user) {
      openAuthModal('login');
      return;
    }

    setIsPosting(true);
    setUploadError(null);

    try {
      let finalImageUrl: string | undefined = undefined;
      if (selectedImageDataUrl) {
        const uploadRes = await api.uploadImage(selectedImageDataUrl);
        finalImageUrl = uploadRes.url;
      }

      const res = await api.createPost(postText.trim(), finalImageUrl, selectedFeeling || undefined);
      setPosts([res.post, ...posts]);
      setPostText('');
      setSelectedImageDataUrl(null);
      setSelectedFeeling(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setUploadError(err.message || 'Failed to publish post.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleSelectReaction = async (postId: string, type: ReactionType) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await api.reactToPost(postId, type);
      setPosts(posts.map(p => p.id === postId ? { ...p, reactions: res.reactions, likes: res.likes } : p));
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentText.trim()) return;
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await api.addComment(postId, commentText.trim());
      setPosts(posts.map(p => p.id === postId ? { ...p, comments: [...p.comments, res.comment] } : p));
      setCommentText('');
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleAddReply = async (postId: string, commentId: string) => {
    if (!replyText.trim()) return;
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await api.addReply(postId, commentId, replyText.trim());
      setPosts(posts.map(p => {
        if (p.id === postId) {
          const updatedComments = p.comments.map(c => {
            if (c.id === commentId) {
              return { ...c, replies: [...(c.replies || []), res.reply] };
            }
            return c;
          });
          return { ...p, comments: updatedComments };
        }
        return p;
      }));
      setReplyingCommentId(null);
      setReplyText('');
    } catch (err) {
      console.error('Reply error:', err);
    }
  };

  const handleToggleBookmark = async (postId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    try {
      const res = await api.savePost(postId);
      setSavedPosts(res.savedPostIds);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const handleSharePost = async (post: Post) => {
    try {
      await api.sharePost(post.id);
      setPosts(posts.map(p => p.id === post.id ? { ...p, sharesCount: (p.sharesCount || 0) + 1 } : p));
      if (navigator.clipboard) {
        navigator.clipboard.writeText(`WNCC Scholar Post: "${post.content.substring(0, 100)}..." by ${post.authorName}`);
        setCopiedPostId(post.id);
        setTimeout(() => setCopiedPostId(null), 2000);
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleAddFriend = async (targetUserId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      await api.sendFriendRequest(targetUserId);
      setSentFriendRequests([...sentFriendRequests, targetUserId]);
    } catch (err: any) {
      alert(err.message || 'Could not send friend request.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed Column (Left 2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Facebook-style Stories Bar */}
          <StoriesBar />

          {/* Create Post Box (Facebook-style with Feeling and Gallery upload) */}
          <div className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-5 shadow-xs">
            <form onSubmit={handleCreatePost} className="space-y-3">
              <div className="flex items-start gap-3">
                <img
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=Guest`}
                  alt=""
                  className="w-10 h-10 rounded-2xl object-cover border border-stone-200 shadow-2xs"
                />
                <div className="flex-1">
                  <textarea
                    rows={2}
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder={
                      user
                        ? `What's on your mind for study or ministry, ${user.displayName}?`
                        : 'Sign in to share reflections, research, or questions with WNCC...'
                    }
                    className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white resize-none transition"
                  />

                  {selectedFeeling && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-semibold mt-1">
                      <span>Feeling: {selectedFeeling}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFeeling(null)}
                        className="text-amber-700 hover:text-amber-950 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Gallery Image Preview */}
              {selectedImageDataUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-50 max-h-72 flex items-center justify-center">
                  <img
                    src={selectedImageDataUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-72 object-contain"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-white text-[11px] font-semibold hover:bg-white/20 rounded-lg"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-1 text-white hover:text-red-300 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Feelings Picker Row */}
              {showFeelingsPicker && (
                <div className="p-2.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-wrap gap-1.5 animate-in fade-in">
                  {FEELINGS.map((feel) => (
                    <button
                      key={feel}
                      type="button"
                      onClick={() => {
                        setSelectedFeeling(feel);
                        setShowFeelingsPicker(false);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-stone-200 rounded-xl text-xs font-medium transition"
                    >
                      {feel}
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Post Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={handleGalleryFileSelect}
                    className="hidden"
                  />

                  {/* Mandated clear button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3.5 py-2 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                  >
                    {isUploadingImage ? (
                      <div className="w-4 h-4 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-amber-800" />
                    )}
                    <span>Upload from Gallery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFeelingsPicker(!showFeelingsPicker)}
                    className="p-2 text-stone-500 hover:text-amber-900 hover:bg-stone-100 rounded-xl transition"
                    title="Add feeling or activity"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={(!postText.trim() && !selectedImageDataUrl) || isPosting}
                  className="px-5 py-2.5 bg-amber-900 hover:bg-amber-850 active:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 transition flex items-center gap-2"
                >
                  {isPosting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white border border-stone-200 rounded-3xl p-5 animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-200 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 bg-stone-200 rounded w-1/4" />
                      <div className="h-3 bg-stone-100 rounded w-1/6" />
                    </div>
                  </div>
                  <div className="h-20 bg-stone-100 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-stone-200 rounded-3xl p-8">
              <Users className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">No posts yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Be the first to share research or reflections with the college community.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => {
                const userReaction = user && post.reactions?.find(r => r.userId === user.id)?.type;
                const isSaved = savedPosts.includes(post.id) || (user?.savedPostIds && user.savedPostIds.includes(post.id));
                const canDelete = user && (user.id === post.authorId || user.isAdmin);
                const isCommentsOpen = activeCommentPostId === post.id;

                // Reaction counts grouped
                const reactionCounts = (post.reactions || []).reduce((acc: any, r) => {
                  acc[r.type] = (acc[r.type] || 0) + 1;
                  return acc;
                }, {});

                return (
                  <article
                    key={post.id}
                    id={post.id}
                    className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs hover:border-stone-300 transition"
                  >
                    {/* Post Author Bar */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        onClick={() => onViewUserProfile(post.authorId)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="relative">
                          <img
                            src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.authorName}`}
                            alt=""
                            className="w-10 h-10 rounded-2xl object-cover border border-stone-200 group-hover:scale-105 transition"
                          />
                          {/* Online green indicator */}
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold text-stone-900 group-hover:text-amber-900">
                              {post.authorName}
                            </span>
                            {post.authorUsername === 'sasuke' && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-950 text-[10px] font-bold rounded">
                                Admin
                              </span>
                            )}
                            {post.feeling && (
                              <span className="text-xs text-stone-500 font-normal">
                                is {post.feeling}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400">
                            @{post.authorUsername} · {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            {post.groupName && (
                              <span className="text-amber-900 font-medium"> in {post.groupName}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setReportTargetPost(post)}
                          className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-stone-50 rounded-lg transition"
                          title="Report post"
                        >
                          <Flag className="w-4 h-4" />
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Delete post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    {post.content && (
                      <p className="text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed mb-3">
                        {post.content}
                      </p>
                    )}

                    {/* Post Image */}
                    {post.imageUrl && (
                      <div className="mb-4 rounded-2xl overflow-hidden border border-stone-100 bg-stone-50 max-h-96">
                        <img
                          src={post.imageUrl}
                          alt="Post media"
                          className="w-full h-auto max-h-96 object-cover cursor-pointer hover:scale-[1.01] transition-transform"
                          onClick={() => window.open(post.imageUrl, '_blank')}
                        />
                      </div>
                    )}

                    {/* Reactions Summary Counter */}
                    {(post.reactions && post.reactions.length > 0) && (
                      <div className="flex items-center justify-between pb-2 text-[11px] text-stone-500 border-b border-stone-100">
                        <div className="flex items-center gap-1">
                          <span className="flex -space-x-1">
                            {Object.keys(reactionCounts).slice(0, 3).map((t) => {
                              const r = REACTIONS.find(item => item.type === t);
                              return r ? <span key={t} className="text-xs">{r.emoji}</span> : null;
                            })}
                          </span>
                          <span className="ml-1 font-semibold">{post.reactions.length}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span>{post.comments.length} comments</span>
                          <span>{post.sharesCount || 0} shares</span>
                        </div>
                      </div>
                    )}

                    {/* Facebook-style Action Toolbar */}
                    <div className="relative flex items-center justify-between pt-2 text-xs font-semibold text-stone-600">
                      {/* Reaction Picker on hover/click */}
                      <div
                        className="relative"
                        onMouseEnter={() => setHoveredReactionPostId(post.id)}
                      >
                        <ReactionPicker
                          isOpen={hoveredReactionPostId === post.id}
                          currentReaction={userReaction || undefined}
                          onSelectReaction={(type) => handleSelectReaction(post.id, type)}
                          onClose={() => setHoveredReactionPostId(null)}
                        />

                        <button
                          onClick={() => handleSelectReaction(post.id, userReaction || 'like')}
                          className={`min-h-[40px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition hover:bg-stone-100 ${
                            userReaction ? 'text-amber-900 font-bold' : ''
                          }`}
                        >
                          <span className="text-sm">
                            {userReaction ? REACTIONS.find(r => r.type === userReaction)?.emoji : '👍'}
                          </span>
                          <span>
                            {userReaction ? REACTIONS.find(r => r.type === userReaction)?.label : 'Like'}
                          </span>
                        </button>
                      </div>

                      {/* Comment Toggle */}
                      <button
                        onClick={() => setActiveCommentPostId(isCommentsOpen ? null : post.id)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-stone-100 flex items-center gap-1.5 transition"
                      >
                        <MessageCircle className="w-4 h-4 text-stone-500" />
                        <span>Comment</span>
                      </button>

                      {/* Share */}
                      <button
                        onClick={() => handleSharePost(post)}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-stone-100 flex items-center gap-1.5 transition"
                      >
                        {copiedPostId === post.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Share2 className="w-4 h-4 text-stone-500" />
                        )}
                        <span>Share</span>
                      </button>

                      {/* Bookmark */}
                      <button
                        onClick={() => handleToggleBookmark(post.id)}
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl hover:bg-stone-100 flex items-center gap-1.5 transition ${
                          isSaved ? 'text-amber-800' : 'text-stone-500'
                        }`}
                        title="Save post"
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-800 text-amber-800' : ''}`} />
                        <span className="hidden sm:inline">Save</span>
                      </button>
                    </div>

                    {/* Comments Section */}
                    {isCommentsOpen && (
                      <div className="mt-3 pt-3 border-t border-stone-100 space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                            placeholder="Write a thoughtful comment..."
                            className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentText.trim()}
                            className="px-3.5 py-2 bg-amber-900 text-white rounded-xl text-xs font-semibold hover:bg-amber-850 disabled:opacity-40"
                          >
                            Send
                          </button>
                        </div>

                        {post.comments.map((comment) => (
                          <div key={comment.id} className="space-y-1.5">
                            <div className="flex items-start gap-2.5 bg-stone-50 p-2.5 sm:p-3 rounded-2xl border border-stone-100">
                              <img
                                src={comment.authorAvatar}
                                alt=""
                                className="w-7 h-7 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-stone-900">{comment.authorName}</span>
                                  <span className="text-[10px] text-stone-400">
                                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-xs text-stone-700 mt-0.5">{comment.content}</p>

                                <button
                                  onClick={() => setReplyingCommentId(replyingCommentId === comment.id ? null : comment.id)}
                                  className="text-[10px] font-semibold text-amber-900 mt-1 hover:underline flex items-center gap-1"
                                >
                                  <CornerDownRight className="w-3 h-3" />
                                  <span>Reply</span>
                                </button>
                              </div>
                            </div>

                            {/* Nested Replies */}
                            {comment.replies && comment.replies.map((reply) => (
                              <div key={reply.id} className="ml-7 flex items-start gap-2 bg-stone-50/80 p-2 rounded-xl border border-stone-100">
                                <img src={reply.authorAvatar} alt="" className="w-5 h-5 rounded-md object-cover" />
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-stone-900">{reply.authorName}</span>
                                    <span className="text-[9px] text-stone-400">{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-xs text-stone-700">{reply.content}</p>
                                </div>
                              </div>
                            ))}

                            {replyingCommentId === comment.id && (
                              <div className="ml-7 flex items-center gap-2 pt-1">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAddReply(post.id, comment.id)}
                                  placeholder={`Reply to ${comment.authorName}...`}
                                  className="flex-1 px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-800"
                                />
                                <button
                                  onClick={() => handleAddReply(post.id, comment.id)}
                                  className="px-2.5 py-1.5 bg-amber-900 text-white rounded-xl text-xs font-semibold"
                                >
                                  Reply
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar: Facebook-style Suggested Friends, Groups, & Memories (Desktop) */}
        <div className="space-y-6">
          {/* Suggested Friends Widget */}
          {suggestedFriends.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-800" />
                <span>People You May Know</span>
              </h3>

              <div className="space-y-3">
                {suggestedFriends.map((scholar) => {
                  const sent = sentFriendRequests.includes(scholar.id);
                  return (
                    <div key={scholar.id} className="flex items-center justify-between gap-3">
                      <div
                        onClick={() => onViewUserProfile(scholar.id)}
                        className="flex items-center gap-2.5 cursor-pointer group flex-1 overflow-hidden"
                      >
                        <img src={scholar.avatarUrl} alt="" className="w-9 h-9 rounded-xl object-cover border border-stone-200" />
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-stone-900 group-hover:text-amber-900 truncate">
                            {scholar.displayName}
                          </p>
                          <p className="text-[10px] text-stone-400 truncate">@{scholar.username}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddFriend(scholar.id)}
                        disabled={sent}
                        className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 shadow-2xs ${
                          sent
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-900 hover:bg-amber-850 text-white'
                        }`}
                      >
                        {sent ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                        <span>{sent ? 'Sent' : 'Add'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Groups Link */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-800" />
                <span>Collegiate Groups</span>
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Join ministerial, biblical language, and academic study circles.
            </p>
            {onNavigateToGroups && (
              <button
                onClick={onNavigateToGroups}
                className="mt-2 w-full py-2 bg-amber-900 text-white rounded-xl text-xs font-semibold hover:bg-amber-850 transition"
              >
                Explore Groups
              </button>
            )}
          </div>

          {/* Memories / On This Day */}
          {memories.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-2.5">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-800" />
                <span>Memories & Highlights</span>
              </h3>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs text-stone-700 leading-relaxed">
                <p className="font-semibold text-stone-900 mb-1">{memories[0].authorName}</p>
                <p className="line-clamp-3">{memories[0].content}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportTargetPost && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTargetPost(null)}
          targetType="post"
          targetId={reportTargetPost.id}
          targetSummary={reportTargetPost.content || 'Image post'}
        />
      )}
    </div>
  );
};
