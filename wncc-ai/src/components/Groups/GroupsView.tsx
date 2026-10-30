import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Group, Post, GroupMessage, MessageAttachment } from '../../types';
import { AttachmentViewer } from '../Common/AttachmentViewer';
import { ReportModal } from '../ReportModal';
import {
  Users,
  Plus,
  Lock,
  Unlock,
  Globe,
  MessageSquare,
  FileText,
  Search,
  Camera,
  Check,
  X,
  Send,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Reply,
  MoreVertical,
  Settings,
  Crown,
  ShieldAlert,
  UserCheck,
  UserX,
  Flag,
  AlertTriangle
} from 'lucide-react';

interface GroupsViewProps {
  onViewUserProfile?: (userId: string) => void;
}

export const GroupsView: React.FC<GroupsViewProps> = ({ onViewUserProfile }) => {
  const { user, openAuthModal, isSuperAdmin: contextIsSuper } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [groupPosts, setGroupPosts] = useState<Post[]>([]);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Tab inside group: 'feed' | 'chat' | 'members'
  const [groupTab, setGroupTab] = useState<'feed' | 'chat' | 'members'>('feed');

  // Create Group Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Theology & Ministry');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'public' | 'private'>('public');
  const [newGroupCover, setNewGroupCover] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Group Settings Modal (Super Admin & Group Owner)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrivacy, setEditPrivacy] = useState<'public' | 'private'>('public');
  const [editIsLocked, setEditIsLocked] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Transfer Ownership Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [newOwnerUserId, setNewOwnerUserId] = useState('');

  // Group Post Input
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Group Chat Input & Rich Attachments
  const [chatText, setChatText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<GroupMessage | null>(null);

  // Reporting
  const [reportTarget, setReportTarget] = useState<{
    type: 'group' | 'post' | 'message';
    id: string;
    summary?: string;
  } | null>(null);

  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await api.getGroups();
      setGroups(res.groups);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = async (groupId: string) => {
    setSelectedGroupId(groupId);
    setLoading(true);
    try {
      const [detailRes, chatRes] = await Promise.all([
        api.getGroup(groupId),
        api.getGroupChat(groupId)
      ]);
      setSelectedGroup(detailRes.group);
      setGroupMembers(detailRes.members);
      setGroupPosts(detailRes.posts);
      setGroupMessages(chatRes.messages);
      setGroupTab('feed');
      setPendingAttachments([]);
      setReplyingToMessage(null);
    } catch (err) {
      console.error('Failed to load group details:', err);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = !!user && (
    contextIsSuper ||
    user.role === 'super_admin' ||
    user.email.toLowerCase() === 'babatundeoyemade0@gmail.com'
  );

  const isGroupOwner = !!user && !!selectedGroup && (selectedGroup.ownerId === user.id);
  const isGroupAdmin = !!user && !!selectedGroup && (
    isGroupOwner ||
    (selectedGroup.adminIds || []).includes(user.id)
  );
  const isMember = !!user && !!selectedGroup && selectedGroup.memberIds.includes(user.id);
  const canManageGroup = isSuperAdmin || isGroupOwner;

  const handleJoinLeave = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!selectedGroup) return;

    if (isGroupOwner && selectedGroup.memberIds.length > 1) {
      alert('As Group Owner, please transfer ownership to another member before leaving.');
      return;
    }

    try {
      if (isMember) {
        await api.leaveGroup(selectedGroup.id);
      } else {
        await api.joinGroup(selectedGroup.id);
      }
      handleSelectGroup(selectedGroup.id);
      loadGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to update group membership.');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    if (!user) {
      openAuthModal('login');
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await api.createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        category: newGroupCategory,
        privacy: newGroupPrivacy,
        coverUrl: newGroupCover || undefined
      });
      setIsCreateModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      setNewGroupCover('');
      loadGroups();
      handleSelectGroup(res.group.id);
    } catch (err: any) {
      alert(err.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const openSettingsModal = () => {
    if (!selectedGroup) return;
    setEditName(selectedGroup.name);
    setEditDesc(selectedGroup.description);
    setEditCategory(selectedGroup.category);
    setEditPrivacy(selectedGroup.privacy);
    setEditIsLocked(!!selectedGroup.isLocked);
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setSavingSettings(true);
    try {
      const res = await api.updateGroup(selectedGroup.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        category: editCategory,
        privacy: editPrivacy,
        isLocked: editIsLocked
      });
      setSelectedGroup(res.group);
      setIsSettingsModalOpen(false);
      loadGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to update group settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteCurrentGroup = () => {
    if (!selectedGroup) return;
    setConfirmModal({
      title: 'Delete Group',
      message: `WARNING: Are you sure you want to permanently delete "${selectedGroup.name}"? All group chat history and member associations will be erased.`,
      confirmLabel: 'Delete Group Permanently',
      onConfirm: async () => {
        try {
          await api.deleteGroup(selectedGroup.id);
          setConfirmModal(null);
          setIsSettingsModalOpen(false);
          setSelectedGroupId(null);
          setSelectedGroup(null);
          loadGroups();
        } catch (err: any) {
          alert(err.message || 'Failed to delete group');
        }
      }
    });
  };

  const handlePromoteAdmin = async (userId: string) => {
    if (!selectedGroup) return;
    try {
      await api.addGroupAdmin(selectedGroup.id, userId);
      handleSelectGroup(selectedGroup.id);
    } catch (err: any) {
      alert(err.message || 'Failed to promote member.');
    }
  };

  const handleDemoteAdmin = async (userId: string) => {
    if (!selectedGroup) return;
    try {
      await api.removeGroupAdmin(selectedGroup.id, userId);
      handleSelectGroup(selectedGroup.id);
    } catch (err: any) {
      alert(err.message || 'Failed to demote admin.');
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!selectedGroup) return;
    setConfirmModal({
      title: 'Remove Member',
      message: `Remove ${memberName} from "${selectedGroup.name}"?`,
      confirmLabel: 'Remove Member',
      onConfirm: async () => {
        try {
          await api.removeGroupMember(selectedGroup.id, userId);
          setConfirmModal(null);
          handleSelectGroup(selectedGroup.id);
        } catch (err: any) {
          alert(err.message || 'Failed to remove member.');
        }
      }
    });
  };

  const handleTransferOwnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newOwnerUserId) return;
    try {
      await api.transferGroupOwnership(selectedGroup.id, newOwnerUserId);
      setIsTransferModalOpen(false);
      setNewOwnerUserId('');
      handleSelectGroup(selectedGroup.id);
      loadGroups();
    } catch (err: any) {
      alert(err.message || 'Failed to transfer ownership');
    }
  };

  const handleGroupPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim() && !postImage) return;
    if (!selectedGroup || !user) return;

    if (selectedGroup.isLocked && !isGroupAdmin && !isSuperAdmin) {
      alert('This group has been locked by administration. Only group moderators can post.');
      return;
    }

    setIsPosting(true);
    try {
      let finalImg = postImage;
      if (postImage && postImage.startsWith('data:')) {
        const up = await api.uploadImage(postImage);
        finalImg = up.url;
      }
      const res = await api.createPost(postText.trim(), finalImg || undefined, undefined, selectedGroup.id);
      setGroupPosts([res.post, ...groupPosts]);
      setPostText('');
      setPostImage(null);
    } catch (err: any) {
      alert(err.message || 'Failed to post in group');
    } finally {
      setIsPosting(false);
    }
  };

  // Chat Attachments Upload
  const handleChatFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const filePayloads = await Promise.all(
        Array.from(files).map(async (file) => {
          return new Promise<{ name: string; size: number; mimeType: string; dataUrl: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                size: file.size,
                mimeType: file.type,
                dataUrl: reader.result as string
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      const res = await api.uploadFiles(filePayloads);
      setPendingAttachments(prev => [...prev, ...res.attachments]);
    } catch (err: any) {
      alert(err.message || 'Failed to upload attachments.');
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = chatText.trim().length > 0;
    const hasAtt = pendingAttachments.length > 0;
    if ((!hasText && !hasAtt) || !selectedGroup || !user) return;

    if (selectedGroup.isLocked && !isGroupAdmin && !isSuperAdmin) {
      alert('This group is locked by administration. Only group moderators can send messages.');
      return;
    }

    const text = chatText.trim();
    const attachmentsToSend = [...pendingAttachments];
    const replyRef = replyingToMessage ? {
      id: replyingToMessage.id,
      senderName: replyingToMessage.senderName,
      content: replyingToMessage.content || 'Attachment'
    } : undefined;

    setChatText('');
    setPendingAttachments([]);
    setReplyingToMessage(null);

    try {
      const res = await api.sendGroupChat(selectedGroup.id, text, attachmentsToSend.length > 0 ? attachmentsToSend : undefined, replyRef);
      setGroupMessages(prev => [...prev, res.message]);
      setTimeout(() => chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err: any) {
      alert(err.message || 'Failed to send group message');
    }
  };

  const handleDeleteGroupMessage = async (messageId: string) => {
    if (!selectedGroup) return;
    try {
      await api.deleteGroupChatMessage(selectedGroup.id, messageId);
      setGroupMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete message.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.deletePost(postId);
      setGroupPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete post.');
    }
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      {/* If a group is selected, show Group Detail View */}
      {selectedGroup ? (
        <div className="space-y-6">
          {/* Top Bar with Back & Settings */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedGroupId(null);
                setSelectedGroup(null);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-amber-900 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Groups</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setReportTarget({ type: 'group', id: selectedGroup.id, summary: selectedGroup.name })}
                className="px-2.5 py-1 text-xs text-stone-500 hover:text-red-700 flex items-center gap-1"
                title="Report Group"
              >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Report</span>
              </button>

              {canManageGroup && (
                <button
                  onClick={openSettingsModal}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Settings className="w-4 h-4 text-stone-600" />
                  <span>Group Settings</span>
                </button>
              )}
            </div>
          </div>

          {/* Group Header Banner */}
          <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="h-44 sm:h-64 relative bg-stone-900 overflow-hidden">
              <img
                src={selectedGroup.coverUrl}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

              <div className="absolute top-4 right-4 flex items-center gap-2">
                {selectedGroup.isLocked && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/90 text-amber-950 font-bold text-xs rounded-full shadow-xs">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked Group</span>
                  </span>
                )}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-semibold">
                  {selectedGroup.privacy === 'private' ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Private</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Public</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                    {selectedGroup.category}
                  </span>
                  {isGroupOwner && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                      <Crown className="w-3 h-3 text-amber-800" /> Group Owner
                    </span>
                  )}
                  {isGroupAdmin && !isGroupOwner && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3 text-blue-700" /> Group Admin
                    </span>
                  )}
                  {isSuperAdmin && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-bold">
                      <ShieldAlert className="w-3 h-3 text-amber-900" /> Super Admin Authority
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold font-serif-heading text-stone-900 mt-1">
                  {selectedGroup.name}
                </h1>
                <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
                  {selectedGroup.description || 'Welcome to our academic circle.'}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  {selectedGroup.memberIds.length} Members · {groupPosts.length} Posts
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleJoinLeave}
                  className={`min-h-[44px] px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition ${
                    isMember
                      ? 'bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 border border-stone-200'
                      : 'bg-amber-900 hover:bg-amber-850 text-white shadow-xs'
                  }`}
                >
                  {isMember ? 'Leave Group' : 'Join Group'}
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-5 sm:px-6 flex items-center gap-4 border-t border-stone-150">
              <button
                onClick={() => setGroupTab('feed')}
                className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  groupTab === 'feed'
                    ? 'border-amber-900 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Discussion Feed</span>
              </button>

              <button
                onClick={() => setGroupTab('chat')}
                className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  groupTab === 'chat'
                    ? 'border-amber-900 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Group Chat</span>
              </button>

              <button
                onClick={() => setGroupTab('members')}
                className={`py-3.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  groupTab === 'members'
                    ? 'border-amber-900 text-amber-900'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Members ({groupMembers.length})</span>
              </button>
            </div>
          </div>

          {/* Locked Notice */}
          {selectedGroup.isLocked && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-xs text-amber-900">
              <Lock className="w-5 h-5 text-amber-800 shrink-0" />
              <div>
                <p className="font-bold">This group is currently locked by administration.</p>
                <p className="text-amber-800/80">Regular members can view content, but only Group Moderators and Super Admins can post messages or stories.</p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 1: GROUP FEED                                              */}
          {/* ============================================================== */}
          {groupTab === 'feed' && (
            <div className="space-y-6">
              {/* Post Composer */}
              {isMember && (!selectedGroup.isLocked || isGroupAdmin || isSuperAdmin) && (
                <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
                  <form onSubmit={handleGroupPost} className="space-y-3">
                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      placeholder={`Share scholarship, prayer request, or question with ${selectedGroup.name}...`}
                      rows={3}
                      className="w-full p-3 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 resize-none"
                    />

                    {postImage && (
                      <div className="relative inline-block">
                        <img src={postImage} alt="" className="h-24 w-24 object-cover rounded-xl border border-stone-200" />
                        <button
                          type="button"
                          onClick={() => setPostImage(null)}
                          className="absolute -top-1 -right-1 p-1 bg-black/70 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <label className="p-2 text-stone-500 hover:text-amber-900 hover:bg-stone-100 rounded-xl cursor-pointer transition flex items-center gap-1.5 text-xs font-semibold">
                        <ImageIcon className="w-4 h-4 text-amber-800" />
                        <span>Add Image</span>
                        <input
                          ref={postImageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => setPostImage(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      <button
                        type="submit"
                        disabled={isPosting || (!postText.trim() && !postImage)}
                        className="px-5 py-2 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 transition"
                      >
                        {isPosting ? 'Posting...' : 'Post to Group'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Group Posts List */}
              <div className="space-y-4">
                {groupPosts.length === 0 ? (
                  <div className="p-12 text-center text-xs text-stone-400 bg-white rounded-3xl border border-stone-200">
                    No posts published in this group yet. Start the conversation!
                  </div>
                ) : (
                  groupPosts.map(p => {
                    const canDeletePost = user && (
                      p.authorId === user.id ||
                      isGroupAdmin ||
                      isSuperAdmin
                    );

                    return (
                      <div
                        key={p.id}
                        className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.authorAvatar}
                              alt=""
                              onClick={() => onViewUserProfile?.(p.authorId)}
                              className="w-10 h-10 rounded-2xl object-cover cursor-pointer bg-stone-200 border border-stone-300"
                            />
                            <div>
                              <p
                                onClick={() => onViewUserProfile?.(p.authorId)}
                                className="font-heading font-bold text-sm text-stone-900 hover:underline cursor-pointer"
                              >
                                {p.authorName}
                              </p>
                              <p className="text-[11px] text-stone-400">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setReportTarget({ type: 'post', id: p.id, summary: p.content })}
                              className="p-1.5 text-stone-400 hover:text-red-700 rounded-lg"
                              title="Report Post"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>

                            {canDeletePost && (
                              <button
                                onClick={() => handleDeletePost(p.id)}
                                className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                title="Delete Post"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                          {p.content}
                        </p>

                        {p.imageUrl && (
                          <div className="rounded-2xl overflow-hidden border border-stone-200 max-h-96">
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: UPGRADED GROUP CHAT                                     */}
          {/* ============================================================== */}
          {groupTab === 'chat' && (
            <div className="bg-white border border-stone-200 rounded-3xl h-[620px] flex flex-col shadow-xs overflow-hidden">
              <div className="p-3.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-stone-800">
                    {selectedGroup.name} Live Discussion
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 font-medium">
                  {groupMessages.length} Messages
                </span>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {groupMessages.length === 0 ? (
                  <p className="text-center text-xs text-stone-400 py-16">
                    No messages yet. Send a greeting, Bible verse, audio note, or document to the group!
                  </p>
                ) : (
                  groupMessages.map((msg) => {
                    const isSender = user && msg.senderId === user.id;
                    const canDeleteMessage = user && (isSender || isGroupAdmin || isSuperAdmin);

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-2.5 group ${isSender ? 'flex-row-reverse' : ''}`}
                      >
                        <img
                          src={msg.senderAvatar}
                          alt=""
                          onClick={() => onViewUserProfile?.(msg.senderId)}
                          className="w-8 h-8 rounded-xl object-cover cursor-pointer bg-stone-200 shrink-0"
                        />

                        <div className={`max-w-md ${isSender ? 'text-right' : 'text-left'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[11px] font-bold text-stone-900">{msg.senderName}</span>
                            <span className="text-[10px] text-stone-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Reply Context Header */}
                          {msg.replyTo && (
                            <div className="mb-1 p-2 bg-stone-100 rounded-lg text-[10px] text-stone-600 border-l-2 border-amber-800 text-left">
                              <span className="font-bold text-amber-900">{msg.replyTo.senderName}: </span>
                              <span className="truncate">{msg.replyTo.content}</span>
                            </div>
                          )}

                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed inline-block text-left shadow-2xs ${
                              isSender
                                ? 'bg-amber-900 text-white rounded-tr-xs'
                                : 'bg-stone-100 text-stone-900 rounded-tl-xs'
                            }`}
                          >
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                            {/* Attachments rendering */}
                            <AttachmentViewer attachments={msg.attachments} />
                          </div>

                          {/* Action Bar (Reply, Report, Delete) */}
                          <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-stone-400">
                            <button
                              type="button"
                              onClick={() => setReplyingToMessage(msg)}
                              className="hover:text-amber-900 flex items-center gap-1"
                            >
                              <Reply className="w-3 h-3" />
                              <span>Reply</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setReportTarget({ type: 'message', id: msg.id, summary: msg.content })}
                              className="hover:text-red-700 flex items-center gap-1"
                            >
                              <Flag className="w-3 h-3" />
                              <span>Report</span>
                            </button>

                            {canDeleteMessage && (
                              <button
                                type="button"
                                onClick={() => handleDeleteGroupMessage(msg.id)}
                                className="hover:text-red-700 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Chat Input Section */}
              {isMember ? (
                selectedGroup.isLocked && !isGroupAdmin && !isSuperAdmin ? (
                  <div className="p-3 bg-amber-50 border-t border-amber-200 text-center text-xs text-amber-900 font-medium">
                    This group is locked by administration. Only group moderators can send messages.
                  </div>
                ) : (
                  <div className="border-t border-stone-200 bg-white p-3 space-y-2">
                    {/* Reply Preview Bar */}
                    {replyingToMessage && (
                      <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <Reply className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                          <span className="font-semibold text-stone-800">
                            Replying to {replyingToMessage.senderName}:
                          </span>
                          <span className="text-stone-500 truncate">
                            {replyingToMessage.content || 'Attachment'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyingToMessage(null)}
                          className="text-stone-400 hover:text-stone-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Pending Attachments List */}
                    {pendingAttachments.length > 0 && (
                      <AttachmentViewer
                        attachments={pendingAttachments}
                        isEditable={true}
                        onRemove={(id) => setPendingAttachments(prev => prev.filter(a => a.id !== id))}
                      />
                    )}

                    <form onSubmit={handleSendGroupMessage} className="flex items-center gap-2">
                      {/* Attachment Picker */}
                      <label className="p-2.5 text-stone-500 hover:text-amber-900 hover:bg-stone-100 rounded-xl cursor-pointer transition">
                        <Paperclip className="w-4 h-4" />
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                          onChange={handleChatFileSelect}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="text"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder="Type a message or attach images, documents, audio..."
                        className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
                      />

                      <button
                        type="submit"
                        disabled={uploadingFiles || (!chatText.trim() && pendingAttachments.length === 0)}
                        className="p-2.5 bg-amber-900 hover:bg-amber-850 text-white rounded-xl shadow-xs disabled:opacity-40 transition flex items-center justify-center"
                      >
                        {uploadingFiles ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  </div>
                )
              ) : (
                <div className="p-4 border-t border-stone-200 text-center text-xs text-stone-500 bg-stone-50">
                  Join this group to participate in group discussions and share materials.
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: MEMBERS & MODERATOR CONTROLS                            */}
          {/* ============================================================== */}
          {groupTab === 'members' && (
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-stone-900 text-base">
                    Group Members ({groupMembers.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Governed under College Academic & Community Guidelines.
                  </p>
                </div>

                {canManageGroup && (
                  <button
                    onClick={() => setIsTransferModalOpen(true)}
                    className="px-3 py-1.5 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-semibold"
                  >
                    Transfer Group Ownership
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {groupMembers.map((m) => {
                  const isThisMemberOwner = m.id === selectedGroup.ownerId;
                  const isThisMemberAdmin = selectedGroup.adminIds?.includes(m.id);

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={m.avatarUrl}
                          alt=""
                          onClick={() => onViewUserProfile?.(m.id)}
                          className="w-10 h-10 rounded-xl object-cover cursor-pointer bg-stone-200 border border-stone-300"
                        />
                        <div className="min-w-0">
                          <p
                            onClick={() => onViewUserProfile?.(m.id)}
                            className="text-xs font-bold text-stone-900 truncate hover:underline cursor-pointer"
                          >
                            {m.displayName}
                          </p>
                          <p className="text-[10px] text-stone-400">@{m.username}</p>
                          <div className="mt-1">
                            {isThisMemberOwner ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-bold">
                                <Crown className="w-2.5 h-2.5" /> Group Owner
                              </span>
                            ) : isThisMemberAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[9px] font-bold">
                                <ShieldCheck className="w-2.5 h-2.5" /> Admin
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-700 text-[9px] font-semibold">
                                Member
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Management actions for Super Admin or Group Owner */}
                      {canManageGroup && !isThisMemberOwner && (
                        <div className="flex items-center justify-end gap-1.5 border-t border-stone-200/80 pt-2 text-[11px]">
                          {isThisMemberAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleDemoteAdmin(m.id)}
                              className="text-stone-500 hover:text-stone-800 font-semibold px-2 py-1"
                            >
                              Demote
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePromoteAdmin(m.id)}
                              className="text-blue-700 hover:underline font-semibold px-2 py-1"
                            >
                              Make Admin
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.id, m.displayName)}
                            className="text-red-600 hover:underline font-semibold px-2 py-1"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* GROUPS DIRECTORY VIEW                                          */
        /* ============================================================== */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-serif-heading text-stone-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-amber-800" />
                <span>WNCC Study & Ministry Groups</span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Join collegiate research circles, preaching fellowships, and campus communities.
              </p>
            </div>

            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                setIsCreateModalOpen(true);
              }}
              className="min-h-[44px] px-5 py-2.5 bg-amber-900 hover:bg-amber-850 text-white rounded-2xl text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Group</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups by name or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-800 shadow-2xs"
            />
          </div>

          {/* Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredGroups.map((group) => {
              const isGroupMember = user && group.memberIds.includes(user.id);
              return (
                <div
                  key={group.id}
                  onClick={() => handleSelectGroup(group.id)}
                  className="bg-white border border-stone-200 hover:border-amber-400 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="h-36 relative bg-stone-900 overflow-hidden">
                      <img
                        src={group.coverUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {group.isLocked && (
                          <span className="px-2.5 py-0.5 bg-amber-500 text-amber-950 font-bold text-[10px] rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 bg-black/50 backdrop-blur-md rounded-full text-white text-[11px] font-semibold flex items-center gap-1">
                          {group.privacy === 'private' ? <Lock className="w-3 h-3 text-amber-300" /> : <Globe className="w-3 h-3 text-emerald-400" />}
                          <span>{group.privacy === 'private' ? 'Private' : 'Public'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                        {group.category}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 group-hover:text-amber-900 transition mt-1">
                        {group.name}
                      </h3>
                      <p className="text-xs text-stone-600 line-clamp-2 mt-1.5 leading-relaxed">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-0 flex items-center justify-between text-xs border-t border-stone-100 pt-3">
                    <span className="text-stone-400 font-medium">
                      {group.memberCount || group.memberIds?.length || 0} Members · {group.recentPostCount || 0} Posts
                    </span>

                    <span className="text-amber-900 font-bold group-hover:underline flex items-center gap-1">
                      <span>{isGroupMember ? 'View Group' : 'Explore'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CREATE NEW GROUP                                        */}
      {/* ============================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold font-serif-heading">Create a New Group</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-stone-300 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Exegetical Greek Scholars"
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Purpose, curriculum alignment, or study goals..."
                  className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                  >
                    <option value="Theology & Ministry">Theology & Ministry</option>
                    <option value="Biblical Languages">Biblical Languages</option>
                    <option value="Church History">Church History</option>
                    <option value="Homiletics">Homiletics</option>
                    <option value="Academic Research">Academic Research</option>
                    <option value="General Fellowship">General Fellowship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Privacy</label>
                  <select
                    value={newGroupPrivacy}
                    onChange={(e) => setNewGroupPrivacy(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                  >
                    <option value="public">Public (Open)</option>
                    <option value="private">Private (Approval)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-150 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: GROUP SETTINGS & LOCK TOGGLE                            */}
      {/* ============================================================== */}
      {isSettingsModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-heading font-bold text-stone-900 text-base">
                Group Settings: {selectedGroup.name}
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Privacy</label>
                  <select
                    value={editPrivacy}
                    onChange={(e) => setEditPrivacy(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              {/* Lock Toggle */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900">Lock Group Discussions</p>
                  <p className="text-[11px] text-stone-500">
                    Restricts chat and post creation strictly to Group Admins.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editIsLocked}
                  onChange={(e) => setEditIsLocked(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDeleteCurrentGroup}
                  className="px-3 py-2 text-red-700 hover:bg-red-50 rounded-xl font-semibold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Group</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsModalOpen(false)}
                    className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-5 py-2 bg-amber-900 hover:bg-amber-850 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TRANSFER GROUP OWNERSHIP                                */}
      {/* ============================================================== */}
      {isTransferModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-stone-200">
            <h4 className="font-heading font-bold text-stone-900 text-base">
              Transfer Ownership of "{selectedGroup.name}"
            </h4>
            <p className="text-xs text-stone-500">
              Select an active group member to hand over full Group Owner authority.
            </p>

            <form onSubmit={handleTransferOwnershipSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Choose New Owner
                </label>
                <select
                  required
                  value={newOwnerUserId}
                  onChange={(e) => setNewOwnerUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                >
                  <option value="">-- Choose member --</option>
                  {groupMembers
                    .filter(m => m.id !== selectedGroup.ownerId)
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.displayName} (@{m.username})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newOwnerUserId}
                  className="px-5 py-2 bg-amber-900 hover:bg-amber-850 text-white rounded-xl font-semibold shadow-xs disabled:opacity-50"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRM ACTION                                          */}
      {/* ============================================================== */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-stone-900 text-base">
                {confirmModal.title}
              </h4>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-150">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmModal.onConfirm()}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                {confirmModal.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REPORT CONTENT                                          */}
      {/* ============================================================== */}
      {reportTarget && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetSummary={reportTarget.summary}
        />
      )}
    </div>
  );
};
