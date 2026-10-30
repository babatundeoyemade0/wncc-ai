import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { User, Post, Group } from '../../types';
import {
  User as UserIcon,
  Edit3,
  Calendar,
  Mail,
  ShieldCheck,
  Users,
  FileText,
  MessageSquare,
  UserPlus,
  Check,
  Camera,
  X,
  AlertCircle,
  GraduationCap,
  Layers,
  Image as ImageIcon,
  UserCheck,
  Flag
} from 'lucide-react';
import { ReportModal } from '../ReportModal';

interface ProfileViewProps {
  targetUserId?: string | null;
  onOpenDirectChat?: (otherUserId: string) => void;
  onNavigateToGroups?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  targetUserId,
  onOpenDirectChat,
  onNavigateToGroups
}) => {
  const { user: currentUser, updateProfile, openAuthModal } = useAuth();

  const isSelf = !targetUserId || (currentUser && currentUser.id === targetUserId);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'about' | 'friends' | 'photos' | 'groups'>('posts');
  const [loading, setLoading] = useState(true);

  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Friend Request State
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [reportUserModalOpen, setReportUserModalOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, [targetUserId, currentUser]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const targetId = isSelf ? currentUser?.id : targetUserId;
      if (!targetId) {
        setProfileUser(null);
        setLoading(false);
        return;
      }

      const [res, groupsRes] = await Promise.all([
        api.getUserProfile(targetId),
        api.getGroups()
      ]);

      setProfileUser(res.user);
      setUserPosts(res.posts);
      setFriendsList(res.friends || []);
      setFollowersCount(res.user.followers?.length || 0);

      if (currentUser && res.user.followers?.includes(currentUser.id)) {
        setIsFollowing(true);
      }

      // Filter groups where this user is member
      const memberGroups = groupsRes.groups.filter(g => g.memberIds.includes(res.user.id));
      setUserGroups(memberGroups);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!profileUser) return;
    setEditDisplayName(profileUser.displayName);
    setEditUsername(profileUser.username);
    setEditBio(profileUser.bio || '');
    setEditAvatarUrl(profileUser.avatarUrl || '');
    setEditCoverUrl(profileUser.coverUrl || '');
    setEditError(null);
    setIsEditing(true);
  };

  const handleImagePicker = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    setLoadingState: (loading: boolean) => void
  ) => {
    setEditError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setEditError('Unsupported image format. Please select JPG, JPEG, PNG, or WEBP.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setEditError('Image size exceeds 15MB limit.');
      return;
    }

    setLoadingState(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const uploadRes = await api.uploadImage(reader.result as string);
        setter(uploadRes.url);
      } catch (err: any) {
        setEditError(err.message || 'Upload failed.');
      } finally {
        setLoadingState(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayName.trim()) {
      setEditError('Display name is required');
      return;
    }

    setEditSaving(true);
    setEditError(null);

    try {
      await updateProfile({
        displayName: editDisplayName.trim(),
        username: editUsername.trim(),
        bio: editBio.trim(),
        avatarUrl: editAvatarUrl,
        coverUrl: editCoverUrl
      });
      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile');
    } finally {
      setEditSaving(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (!profileUser) return;

    try {
      const res = await api.followUser(profileUser.id);
      setIsFollowing(res.following);
      setFollowersCount(res.followersCount);
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (!profileUser) return;

    try {
      await api.sendFriendRequest(profileUser.id);
      setFriendRequestSent(true);
    } catch (err: any) {
      alert(err.message || 'Could not send friend request.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-56 bg-stone-200 rounded-3xl" />
        <div className="h-32 bg-stone-100 rounded-3xl" />
      </div>
    );
  }

  if (!currentUser && isSelf) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-serif-heading text-stone-900">Sign In to View Your Profile</h2>
        <p className="text-xs text-stone-500 mt-2 mb-6">
          Access your conversations, photos, friends, and interact with the WNCC academic community.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="w-full py-3.5 bg-amber-900 hover:bg-amber-850 text-white rounded-2xl text-sm font-semibold shadow-md transition"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <h2 className="text-lg font-bold text-stone-900">User Profile Not Found</h2>
        <p className="text-xs text-stone-500 mt-1">This user could not be located in the WNCC directory.</p>
      </div>
    );
  }

  const isFriend = currentUser?.friends && currentUser.friends.includes(profileUser.id);
  const userPhotos = userPosts.filter(p => !!p.imageUrl);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 pb-28 md:pb-12 space-y-6">
      {/* Facebook-style Cover Banner & Avatar */}
      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs relative">
        {/* Cover Photo */}
        <div className="h-44 sm:h-64 relative bg-stone-900 overflow-hidden">
          <img
            src={
              profileUser.coverUrl ||
              'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80'
            }
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

          {isSelf && (
            <button
              onClick={openEditModal}
              className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Edit Cover Photo</span>
            </button>
          )}
        </div>

        {/* Profile Info Bar */}
        <div className="px-5 sm:px-8 pb-6 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-5">
            {/* Avatar with gold border */}
            <div className="relative inline-block self-start">
              <img
                src={profileUser.avatarUrl}
                alt={profileUser.displayName}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover border-4 border-white shadow-xl bg-stone-100"
              />
              {isSelf && (
                <button
                  onClick={openEditModal}
                  className="absolute bottom-1 right-1 p-2.5 bg-amber-900 text-white rounded-2xl shadow-md hover:bg-amber-850 transition"
                  title="Change profile photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Action Buttons - Large 44px+ tap targets */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {isSelf ? (
                <button
                  onClick={openEditModal}
                  className="flex-1 sm:flex-none min-h-[44px] px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition"
                >
                  <Edit3 className="w-4 h-4 text-stone-600" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  {/* Direct Message button */}
                  {onOpenDirectChat && (
                    <button
                      onClick={() => onOpenDirectChat(profileUser.id)}
                      className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 bg-amber-900 hover:bg-amber-850 text-white font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                  )}

                  {/* Follow Button */}
                  <button
                    onClick={handleToggleFollow}
                    className={`flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition ${
                      isFollowing
                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>

                  {/* Add Friend Button */}
                  {!isFriend && (
                    <button
                      onClick={handleSendFriendRequest}
                      disabled={friendRequestSent}
                      className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-2xl text-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
                    >
                      {friendRequestSent ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>Sent</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Add Friend</span>
                        </>
                      )}
                    </button>
                  )}

                  {isFriend && (
                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Friends</span>
                    </div>
                  )}

                  {/* Report user button */}
                  <button
                    onClick={() => setReportUserModalOpen(true)}
                    className="min-h-[44px] px-3.5 py-2.5 text-stone-500 hover:text-red-700 hover:bg-red-50 border border-stone-200 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition"
                    title="Report Account"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Names & Identity Badges */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-serif-heading text-stone-900">
                {profileUser.displayName}
              </h1>
              {profileUser.isSuperAdmin || profileUser.role === 'super_admin' ? (
                <span className="px-2.5 py-0.5 bg-amber-200 text-amber-950 border border-amber-400 text-xs font-bold rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-900" />
                  <span>Super Admin (Platform Owner)</span>
                </span>
              ) : profileUser.isAdmin ? (
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                  <span>WNCC Administrator</span>
                </span>
              ) : null}
            </div>

            <p className="text-xs sm:text-sm font-semibold text-stone-500">
              @{profileUser.username}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-stone-700 mt-3 max-w-2xl leading-relaxed whitespace-pre-wrap">
            {profileUser.bio || 'WNCC Scholar & Theological Researcher'}
          </p>

          {/* Meta & Stats */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-4 pt-4 border-t border-stone-100 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-stone-400" />
              <span>Joined {new Date(profileUser.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-stone-400" />
              <span><strong className="text-stone-800">{friendsList.length}</strong> Friends</span>
            </div>

            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-stone-400" />
              <span><strong className="text-stone-800">{followersCount}</strong> Followers</span>
            </div>

            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-stone-400" />
              <span><strong className="text-stone-800">{userPosts.length}</strong> Posts</span>
            </div>
          </div>
        </div>

        {/* Facebook-style Profile Tabs: Posts, About, Friends, Photos, Groups */}
        <div className="flex items-center gap-1 px-5 border-t border-stone-200 bg-stone-50/70 overflow-x-auto scrollbar-none">
          {[
            { id: 'posts', label: 'Posts', icon: FileText },
            { id: 'about', label: 'About', icon: UserIcon },
            { id: 'friends', label: `Friends (${friendsList.length})`, icon: Users },
            { id: 'photos', label: `Photos (${userPhotos.length})`, icon: ImageIcon },
            { id: 'groups', label: `Groups (${userGroups.length})`, icon: Layers }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`min-h-[44px] px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${
                  isActive
                    ? 'border-amber-900 text-amber-900 bg-white/50'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center">
              <p className="text-xs text-stone-500">No posts shared yet by this user.</p>
            </div>
          ) : (
            userPosts.map((post) => (
              <div key={post.id} className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <img src={post.authorAvatar} alt="" className="w-9 h-9 rounded-2xl object-cover" />
                  <div>
                    <p className="text-xs font-bold text-stone-900">{post.authorName}</p>
                    <p className="text-[10px] text-stone-400">
                      {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-stone-800 whitespace-pre-wrap">{post.content}</p>
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden max-h-80 border border-stone-100">
                    <img src={post.imageUrl} alt="" className="w-full h-auto max-h-80 object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-stone-400 pt-2 border-t border-stone-100">
                  <span>{post.likes.length} Likes / Reactions</span>
                  <span>{post.comments.length} Comments</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'about' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4 text-xs sm:text-sm">
          <h3 className="text-base font-bold text-stone-900 font-serif-heading">About {profileUser.displayName}</h3>
          <div className="space-y-3 text-stone-700">
            <p><strong>Biography:</strong> {profileUser.bio}</p>
            <p><strong>Collegiate Institution:</strong> West Nigeria Christian College (WNCC)</p>
            <p><strong>Username:</strong> @{profileUser.username}</p>
            {isSelf && <p><strong>Email Address:</strong> {profileUser.email}</p>}
            <p><strong>Account Role:</strong> {profileUser.isAdmin ? 'Collegiate Administrator' : 'Student & Scholar'}</p>
          </div>
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 font-serif-heading">Friends ({friendsList.length})</h3>
          {friendsList.length === 0 ? (
            <p className="text-xs text-stone-400 py-4">No friends connected yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {friendsList.map((f) => (
                <div key={f.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={f.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    <div>
                      <p className="text-xs font-bold text-stone-900">{f.displayName}</p>
                      <p className="text-[10px] text-stone-400">@{f.username}</p>
                    </div>
                  </div>
                  {onOpenDirectChat && (
                    <button
                      onClick={() => onOpenDirectChat(f.id)}
                      className="p-1.5 text-amber-900 hover:bg-amber-100 rounded-lg text-xs"
                      title="Direct Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 font-serif-heading">Photos ({userPhotos.length})</h3>
          {userPhotos.length === 0 ? (
            <p className="text-xs text-stone-400 py-4">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userPhotos.map((p) => (
                <div key={p.id} className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
                  <img src={p.imageUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-stone-900 font-serif-heading">Groups ({userGroups.length})</h3>
          {userGroups.length === 0 ? (
            <p className="text-xs text-stone-400 py-4">Not a member of any study groups yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userGroups.map((g) => (
                <div key={g.id} className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
                  <img src={g.coverUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <p className="text-xs font-bold text-stone-900">{g.name}</p>
                    <p className="text-[10px] text-stone-400">{g.category} · {g.memberIds.length} Members</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-serif-heading">Edit Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-stone-300 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Profile Picture */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <img
                    src={editAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${editDisplayName}`}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shadow-xs"
                  />

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={(e) => handleImagePicker(e, setEditAvatarUrl, setIsUploadingAvatar)}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="min-h-[44px] px-4 py-2 bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                  >
                    <Camera className="w-4 h-4 text-amber-800" />
                    <span>Upload from Gallery</span>
                  </button>
                </div>
              </div>

              {/* Cover Photo */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">Cover Photo</label>
                <div className="space-y-2">
                  {editCoverUrl && (
                    <img src={editCoverUrl} alt="Cover Preview" className="w-full h-24 object-cover rounded-xl border border-stone-200" />
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={(e) => handleImagePicker(e, setEditCoverUrl, setIsUploadingCover)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="w-full min-h-[44px] py-2 bg-stone-100 hover:bg-amber-100 text-stone-800 hover:text-amber-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-800" />
                    <span>Upload Cover from Gallery</span>
                  </button>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-stone-400 font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Your academic interests, ministry focus, and background..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-amber-800 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="min-h-[44px] px-5 py-2 text-stone-600 hover:bg-stone-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="min-h-[44px] px-6 py-2 bg-amber-900 hover:bg-amber-850 text-white rounded-xl font-semibold shadow-xs disabled:opacity-40 transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report User Modal */}
      {profileUser && !isSelf && (
        <ReportModal
          isOpen={reportUserModalOpen}
          onClose={() => setReportUserModalOpen(false)}
          targetType="user"
          targetId={profileUser.id}
          targetSummary={`User: ${profileUser.displayName} (@${profileUser.username})`}
        />
      )}
    </div>
  );
};
