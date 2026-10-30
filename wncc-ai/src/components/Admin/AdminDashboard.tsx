import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  Topic,
  PlatformStats,
  Announcement,
  User,
  Group,
  Report,
  Appeal,
  AdminLog,
  PlatformBranding
} from '../../types';
import {
  ShieldAlert,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  Megaphone,
  Layers,
  Settings,
  BarChart3,
  Users,
  Check,
  X,
  AlertCircle,
  Tag,
  Palette,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  ShieldCheck,
  Scale,
  History,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  UserPlus,
  KeyRound,
  MessageSquare
} from 'lucide-react';

const ADMIN_EMAIL = 'babatundeoyemade0@gmail.com';

export const AdminDashboard: React.FC = () => {
  const { user, isSuperAdmin: contextIsSuper } = useAuth();

  // Super Admin validation (Primary owner or super_admin role)
  const isAuthorized = !!user && (
    contextIsSuper ||
    user.role === 'super_admin' ||
    user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  const [activeTab, setActiveTab] = useState<
    'branding' | 'users' | 'groups' | 'reports' | 'appeals' | 'logs' | 'topics' | 'categories' | 'announcements' | 'ai_settings' | 'stats'
  >('branding');

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  // Platform Branding State
  const [branding, setBranding] = useState<PlatformBranding>({
    siteName: 'WNCC AI',
    logoUrl: '',
    tagline: 'West Nigeria Christian College Academic & Community Platform',
    primaryColor: '#78350f',
    announcementBanner: '',
    rules: []
  });
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingSuccess, setBrandingSuccess] = useState(false);
  const [newRuleInput, setNewRuleInput] = useState('');

  // Users State
  const [userList, setUserList] = useState<User[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('');
  const [targetUserForBan, setTargetUserForBan] = useState<User | null>(null);

  // Groups State
  const [groupList, setGroupList] = useState<Group[]>([]);
  const [searchGroupQuery, setSearchGroupQuery] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [transferGroup, setTransferGroup] = useState<Group | null>(null);
  const [newOwnerUserId, setNewOwnerUserId] = useState('');

  // Reports State
  const [reportList, setReportList] = useState<Report[]>([]);
  const [resolvingReport, setResolvingReport] = useState<Report | null>(null);
  const [actionTakenInput, setActionTakenInput] = useState('');

  // Appeals State
  const [appealList, setAppealList] = useState<Appeal[]>([]);

  // Logs State
  const [logList, setLogList] = useState<AdminLog[]>([]);

  // Topics & Categories State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTopicQuery, setSearchTopicQuery] = useState('');

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annImportant, setAnnImportant] = useState(true);

  // AI Custom Instructions
  const [aiInstructions, setAiInstructions] = useState('');
  const [savingAiSettings, setSavingAiSettings] = useState(false);
  const [aiSettingsSaved, setAiSettingsSaved] = useState(false);

  // New/Edit Topic Modal
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicSubject, setTopicSubject] = useState('');
  const [topicCategory, setTopicCategory] = useState('');
  const [topicExplanation, setTopicExplanation] = useState('');
  const [topicKeywords, setTopicKeywords] = useState('');
  const [topicBibleReferences, setTopicBibleReferences] = useState('');
  const [topicNotes, setTopicNotes] = useState('');
  const [topicStudyMaterial, setTopicStudyMaterial] = useState('');
  const [topicSearchTerms, setTopicSearchTerms] = useState('');
  const [topicError, setTopicError] = useState<string | null>(null);
  const [savingTopic, setSavingTopic] = useState(false);

  // Category State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Destructive Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  useEffect(() => {
    if (isAuthorized) {
      loadAllAdminData();
    }
  }, [isAuthorized]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [
        statsRes,
        topicsRes,
        catRes,
        annRes,
        settingsRes,
        brandingRes,
        usersRes,
        groupsRes,
        reportsRes,
        appealsRes,
        logsRes
      ] = await Promise.all([
        api.getAdminStats(),
        api.getTopics(),
        api.getCategories(),
        api.getAnnouncements(),
        api.getAdminSettings(),
        api.getBranding().catch(() => ({ branding: branding })),
        api.getAdminUsers().catch(() => ({ users: [] })),
        api.getGroups().catch(() => ({ groups: [] })),
        api.getAdminReports().catch(() => ({ reports: [] })),
        api.getAdminAppeals().catch(() => ({ appeals: [] })),
        api.getAdminLogs().catch(() => ({ logs: [] }))
      ]);

      setStats(statsRes.stats);
      setTopics(topicsRes.topics);
      setCategories(catRes.categories);
      setAnnouncements(annRes.announcements);
      setAiInstructions(settingsRes.settings?.customAiInstructions || '');

      if (brandingRes.branding) {
        setBranding(brandingRes.branding);
      }
      setUserList(usersRes.users || []);
      setGroupList(groupsRes.groups || []);
      setReportList(reportsRes.reports || []);
      setAppealList(appealsRes.appeals || []);
      setLogList(logsRes.logs || []);

      if (catRes.categories.length > 0 && !topicCategory) {
        setTopicCategory(catRes.categories[0]);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // BRANDING HANDLERS
  // ==========================================
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await api.updateAdminBranding(branding);
      setBranding(res.branding);
      setBrandingSuccess(true);
      setTimeout(() => setBrandingSuccess(false), 3000);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update platform branding.');
    } finally {
      setSavingBranding(false);
    }
  };

  const handleAddRule = () => {
    if (!newRuleInput.trim()) return;
    setBranding(prev => ({
      ...prev,
      rules: [...(prev.rules || []), newRuleInput.trim()]
    }));
    setNewRuleInput('');
  };

  const handleRemoveRule = (index: number) => {
    setBranding(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  // ==========================================
  // USER MODERATION HANDLERS
  // ==========================================
  const handleToggleBanUser = (target: User) => {
    if (target.isBanned) {
      // Unban
      setConfirmationModal({
        isOpen: true,
        title: 'Reactivate User Account',
        message: `Are you sure you want to lift the suspension for ${target.displayName} (${target.email})?`,
        confirmLabel: 'Reactivate Account',
        onConfirm: async () => {
          await api.banUser(target.id, false);
          setConfirmationModal(null);
          loadAllAdminData();
        }
      });
    } else {
      // Ban
      setTargetUserForBan(target);
      setBanReasonInput('Violation of college community guidelines and behavioral policies.');
    }
  };

  const confirmBanSubmission = async () => {
    if (!targetUserForBan) return;
    try {
      await api.banUser(targetUserForBan.id, true, banReasonInput);
      setTargetUserForBan(null);
      setBanReasonInput('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to suspend user.');
    }
  };

  const handleDeleteUser = (target: User) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Permanently Delete User',
      message: `WARNING: This will permanently delete the account for "${target.displayName}" (@${target.username}). This action is irreversible.`,
      confirmLabel: 'Delete Permanently',
      onConfirm: async () => {
        try {
          await api.deleteUser(target.id);
          setConfirmationModal(null);
          loadAllAdminData();
        } catch (err: any) {
          alert(err.message || 'Failed to delete user.');
        }
      }
    });
  };

  const handleChangeUserRole = async (target: User, role: 'user' | 'admin' | 'super_admin') => {
    setConfirmationModal({
      isOpen: true,
      title: 'Change User Role',
      message: `Change permission level for ${target.displayName} to "${role.replace('_', ' ').toUpperCase()}"?`,
      confirmLabel: 'Update Role',
      onConfirm: async () => {
        try {
          await api.updateUserRole(target.id, role);
          setConfirmationModal(null);
          loadAllAdminData();
        } catch (err: any) {
          alert(err.message || 'Failed to update user role.');
        }
      }
    });
  };

  // ==========================================
  // GROUP MANAGEMENT HANDLERS
  // ==========================================
  const handleToggleLockGroup = async (group: Group) => {
    const newLockState = !group.isLocked;
    try {
      await api.updateGroup(group.id, { isLocked: newLockState });
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle group lock.');
    }
  };

  const handleDeleteGroup = (group: Group) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Group',
      message: `Are you sure you want to permanently delete group "${group.name}"? All group chat history and member lists will be removed.`,
      confirmLabel: 'Delete Group',
      onConfirm: async () => {
        try {
          await api.deleteGroup(group.id);
          setConfirmationModal(null);
          loadAllAdminData();
        } catch (err: any) {
          alert(err.message || 'Failed to delete group.');
        }
      }
    });
  };

  const handleTransferOwnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferGroup || !newOwnerUserId) return;
    try {
      await api.transferGroupOwnership(transferGroup.id, newOwnerUserId);
      setTransferGroup(null);
      setNewOwnerUserId('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to transfer ownership.');
    }
  };

  // ==========================================
  // REPORTS & APPEALS HANDLERS
  // ==========================================
  const handleResolveReport = async (status: 'resolved' | 'dismissed') => {
    if (!resolvingReport) return;
    try {
      await api.resolveReport(resolvingReport.id, status, actionTakenInput);
      setResolvingReport(null);
      setActionTakenInput('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update report.');
    }
  };

  const handleReviewAppeal = async (appealId: string, status: 'approved' | 'rejected') => {
    try {
      await api.reviewAppeal(appealId, status);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to process appeal.');
    }
  };

  // ==========================================
  // TOPICS CRUD HANDLERS
  // ==========================================
  const openCreateTopic = () => {
    setEditingTopicId(null);
    setTopicTitle('');
    setTopicSubject('');
    setTopicCategory(categories[0] || 'Theology');
    setTopicExplanation('');
    setTopicKeywords('');
    setTopicBibleReferences('');
    setTopicNotes('');
    setTopicStudyMaterial('');
    setTopicSearchTerms('');
    setTopicError(null);
    setIsTopicModalOpen(true);
  };

  const openEditTopic = (t: Topic) => {
    setEditingTopicId(t.id);
    setTopicTitle(t.title);
    setTopicSubject(t.subject);
    setTopicCategory(t.category);
    setTopicExplanation(t.explanation);
    setTopicKeywords((t.keywords || []).join(', '));
    setTopicBibleReferences((t.bibleReferences || []).join(', '));
    setTopicNotes(t.notes || '');
    setTopicStudyMaterial(t.studyMaterial || '');
    setTopicSearchTerms((t.searchTerms || []).join(', '));
    setTopicError(null);
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicTitle.trim() || !topicSubject.trim() || !topicExplanation.trim()) {
      setTopicError('Title, subject, and explanation are required.');
      return;
    }

    setSavingTopic(true);
    setTopicError(null);

    const payload = {
      title: topicTitle.trim(),
      subject: topicSubject.trim(),
      category: topicCategory,
      explanation: topicExplanation.trim(),
      keywords: topicKeywords.split(',').map(s => s.trim()).filter(Boolean),
      bibleReferences: topicBibleReferences.split(',').map(s => s.trim()).filter(Boolean),
      notes: topicNotes.trim(),
      studyMaterial: topicStudyMaterial.trim(),
      searchTerms: topicSearchTerms.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (editingTopicId) {
        await api.updateAdminTopic(editingTopicId, payload);
      } else {
        await api.addAdminTopic(payload);
      }
      setIsTopicModalOpen(false);
      loadAllAdminData();
    } catch (err: any) {
      setTopicError(err.message || 'Failed to save topic.');
    } finally {
      setSavingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId: string, title: string) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Knowledge Topic',
      message: `Delete topic "${title}" from the knowledge base?`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.deleteAdminTopic(topicId);
          setConfirmationModal(null);
          loadAllAdminData();
        } catch (err: any) {
          alert(err.message || 'Failed to delete topic.');
        }
      }
    });
  };

  // Categories Handlers
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await api.addAdminCategory(newCategoryName.trim());
      setCategories(res.categories);
      setNewCategoryName('');
    } catch (err: any) {
      alert(err.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Category',
      message: `Remove category "${cat}"?`,
      confirmLabel: 'Remove',
      onConfirm: async () => {
        try {
          const res = await api.deleteAdminCategory(cat);
          setCategories(res.categories);
          setConfirmationModal(null);
        } catch (err: any) {
          alert(err.message || 'Failed to delete category');
        }
      }
    });
  };

  // Announcements Handlers
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    try {
      await api.addAdminAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        important: annImportant
      });
      setAnnTitle('');
      setAnnContent('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to publish announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await api.deleteAdminAnnouncement(id);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  // AI Instructions Handler
  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAiSettings(true);
    try {
      await api.saveAdminSettings(aiInstructions);
      setAiSettingsSaved(true);
      setTimeout(() => setAiSettingsSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save AI instructions');
    } finally {
      setSavingAiSettings(false);
    }
  };

  // Not authorized view
  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-stone-900 mb-2">
          Administrator Access Required
        </h2>
        <p className="text-stone-600 max-w-md mx-auto text-sm leading-relaxed mb-6">
          This administration dashboard is restricted to authorized College Super Administrators.
          Please sign in with verified administrative credentials.
        </p>
      </div>
    );
  }

  const filteredTopics = topics.filter(t =>
    t.title.toLowerCase().includes(searchTopicQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchTopicQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTopicQuery.toLowerCase())
  );

  const filteredUsers = userList.filter(u =>
    u.displayName.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  const filteredGroups = groupList.filter(g =>
    g.name.toLowerCase().includes(searchGroupQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchGroupQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner / Owner Identity */}
      <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-850 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-amber-800/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Super Administrator & Platform Owner</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-amber-50">
            {branding.siteName} Control Center
          </h1>
          <p className="text-amber-200/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Full governance of branding, AI intelligence, academic curriculum, user moderation,
            group permissions, appeals, and platform audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAllAdminData}
            disabled={loading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh All</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-200 scrollbar-none">
        {[
          { id: 'branding', label: 'Platform Branding & Rules', icon: Palette },
          { id: 'users', label: `Users (${userList.length})`, icon: Users },
          { id: 'groups', label: `Groups (${groupList.length})`, icon: Layers },
          { id: 'reports', label: `Reports (${reportList.filter(r => r.status === 'pending').length} pending)`, icon: AlertTriangle },
          { id: 'appeals', label: `Appeals (${appealList.filter(a => a.status === 'pending').length})`, icon: Scale },
          { id: 'logs', label: 'Audit Logs', icon: History },
          { id: 'topics', label: `Knowledge (${topics.length})`, icon: BookOpen },
          { id: 'categories', label: 'Categories', icon: Tag },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'ai_settings', label: 'AI Settings', icon: Sparkles },
          { id: 'stats', label: 'Analytics', icon: BarChart3 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-900 text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PLATFORM BRANDING & RULES                               */}
      {/* ============================================================== */}
      {activeTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-6">
            <div>
              <h3 className="font-heading text-lg font-bold text-stone-900">
                Platform Identity & Visual Branding
              </h3>
              <p className="text-xs text-stone-500">
                Update the official name, logo, college tagline, and announcement ticker visible to all visitors and students.
              </p>
            </div>

            {brandingSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Platform branding and rules updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveBranding} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Website Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={branding.siteName}
                    onChange={(e) => setBranding({ ...branding, siteName: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Primary Brand Color (Hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={branding.primaryColor || '#78350f'}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-xl border border-stone-200 cursor-pointer p-0.5 bg-stone-50"
                    />
                    <input
                      type="text"
                      value={branding.primaryColor || '#78350f'}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl font-mono text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={branding.logoUrl || ''}
                  onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tagline / Collegiate Motto
                </label>
                <input
                  type="text"
                  value={branding.tagline || ''}
                  onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Global Announcement Banner
                </label>
                <textarea
                  rows={2}
                  value={branding.announcementBanner || ''}
                  onChange={(e) => setBranding({ ...branding, announcementBanner: e.target.value })}
                  placeholder="Displays at top of pages for official notices..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-800 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-stone-150 flex justify-end">
                <button
                  type="submit"
                  disabled={savingBranding}
                  className="px-6 py-2.5 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition flex items-center gap-2"
                >
                  {savingBranding ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Save Platform Branding</span>
                </button>
              </div>
            </form>
          </div>

          {/* Rules Configuration */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-stone-900">
                Community Rules & Standards
              </h3>
              <p className="text-xs text-stone-500">
                Official rules displayed to users, enforcing academic integrity and Christian order.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRuleInput}
                  onChange={(e) => setNewRuleInput(e.target.value)}
                  placeholder="Enter a new rule..."
                  className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRule();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="px-3 py-2 bg-amber-900 text-white rounded-xl text-xs font-bold hover:bg-amber-850"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {(branding.rules || []).map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs flex items-start justify-between gap-2 text-stone-800"
                  >
                    <span className="font-bold text-amber-900 mr-1">{idx + 1}.</span>
                    <span className="flex-1 leading-relaxed">{rule}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(idx)}
                      className="text-stone-400 hover:text-red-700 p-1"
                      title="Remove rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveBranding}
                disabled={savingBranding}
                className="w-full mt-2 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition"
              >
                Apply Rules Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: USERS MANAGEMENT & ROLE GOVERNANCE                     */}
      {/* ============================================================== */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-stone-900">
                User Management & Permissions
              </h3>
              <p className="text-xs text-stone-500">
                Review accounts, assign administrative roles, ban or reactivate suspended students.
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Search user name, email, @handle..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-800"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-500 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-3">User</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150">
                {filteredUsers.map(u => {
                  const isPrimaryAdmin = u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                  return (
                    <tr key={u.id} className="hover:bg-stone-50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-xl object-cover bg-stone-200 border border-stone-300"
                          />
                          <div>
                            <p className="font-bold text-stone-900">{u.displayName}</p>
                            <p className="text-[10px] text-stone-500">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-600 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            u.isSuperAdmin || u.role === 'super_admin'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : u.role === 'admin' || u.isAdmin
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {u.role || (u.isAdmin ? 'admin' : 'user')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {u.isBanned ? (
                          <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[10px]">
                            <UserX className="w-3 h-3" /> Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                            <UserCheck className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role Selector */}
                          {!isPrimaryAdmin && (
                            <select
                              value={u.role || (u.isAdmin ? 'admin' : 'user')}
                              onChange={(e) => handleChangeUserRole(u, e.target.value as any)}
                              className="px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-[11px] text-stone-700 font-medium focus:outline-none"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          )}

                          {/* Ban / Unban */}
                          {!isPrimaryAdmin && (
                            <button
                              onClick={() => handleToggleBanUser(u)}
                              className={`p-1.5 rounded-lg border text-xs font-semibold transition ${
                                u.isBanned
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                  : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                              title={u.isBanned ? 'Reactivate User' : 'Suspend User'}
                            >
                              {u.isBanned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Delete Account */}
                          {!isPrimaryAdmin && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: GROUPS GOVERNANCE                                       */}
      {/* ============================================================== */}
      {activeTab === 'groups' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-stone-900">
                Group Governance & Moderation
              </h3>
              <p className="text-xs text-stone-500">
                Super Admin can access any group, toggle lock status, transfer ownership, and moderate discussions.
              </p>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchGroupQuery}
                onChange={(e) => setSearchGroupQuery(e.target.value)}
                placeholder="Search groups by name..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map(g => {
              const ownerUser = userList.find(u => u.id === g.ownerId);
              return (
                <div
                  key={g.id}
                  className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={g.avatarUrl}
                        alt=""
                        className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-bold text-sm text-stone-900 truncate">
                          {g.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-stone-500">
                          <span className="font-semibold text-amber-800">{g.category}</span>
                          <span>•</span>
                          <span>{g.memberIds.length} members</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {g.description || 'No description provided.'}
                    </p>

                    <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 text-[11px] space-y-1">
                      <p className="text-stone-500">
                        <span className="font-semibold text-stone-700">Owner:</span>{' '}
                        {ownerUser?.displayName || g.ownerId}
                      </p>
                      <p className="text-stone-500">
                        <span className="font-semibold text-stone-700">Moderators:</span>{' '}
                        {g.adminIds?.length || 1} admins
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-stone-200/80 pt-3 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleLockGroup(g)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                        g.isLocked
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {g.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-800" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{g.isLocked ? 'Locked' : 'Unlocked'}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setTransferGroup(g);
                          setNewOwnerUserId('');
                        }}
                        className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
                        title="Transfer Group Ownership"
                      >
                        Transfer
                      </button>

                      <button
                        onClick={() => handleDeleteGroup(g)}
                        className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                        title="Delete Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: REPORTS & CONTENT MODERATION                            */}
      {/* ============================================================== */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-stone-900">
              Community Reports & Moderation
            </h3>
            <p className="text-xs text-stone-500">
              Review flagged content and misconduct reports submitted by students or moderators.
            </p>
          </div>

          {reportList.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              No reports filed yet. The community is operating peacefully.
            </div>
          ) : (
            <div className="space-y-3">
              {reportList.map(r => (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border transition ${
                    r.status === 'pending'
                      ? 'bg-amber-50/40 border-amber-200'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-900 text-white font-bold text-[10px] uppercase">
                        {r.targetType}
                      </span>
                      <span className="font-bold text-xs text-stone-900">{r.reason}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span>Reported by: <strong className="text-stone-700">{r.reporterName}</strong></span>
                      <span>•</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {r.targetSummary && (
                    <p className="text-xs text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200 mb-2 font-mono">
                      Target summary: {r.targetSummary}
                    </p>
                  )}

                  {r.details && (
                    <p className="text-xs text-stone-600 mb-3 italic">
                      "{r.details}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/80">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        r.status === 'pending' ? 'text-amber-800' : 'text-stone-500'
                      }`}
                    >
                      Status: {r.status} {r.actionTaken && `(${r.actionTaken})`}
                    </span>

                    {r.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setResolvingReport(r);
                            setActionTakenInput('Content moderated; warning issued.');
                          }}
                          className="px-3 py-1.5 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs"
                        >
                          Resolve Report
                        </button>
                        <button
                          onClick={() => {
                            setResolvingReport(r);
                            setActionTakenInput('Dismissed after review.');
                          }}
                          className="px-3 py-1.5 border border-stone-200 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-semibold"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: BAN APPEALS REVIEW                                      */}
      {/* ============================================================== */}
      {activeTab === 'appeals' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-stone-900">
              Student & User Ban Appeals
            </h3>
            <p className="text-xs text-stone-500">
              Appeals submitted by suspended accounts. Approving an appeal will immediately unban and restore the user's account.
            </p>
          </div>

          {appealList.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              No appeals pending review.
            </div>
          ) : (
            <div className="space-y-3">
              {appealList.map(a => (
                <div
                  key={a.id}
                  className={`p-4 rounded-2xl border ${
                    a.status === 'pending'
                      ? 'bg-amber-50/50 border-amber-200'
                      : a.status === 'approved'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-stone-900">{a.userName} ({a.userEmail})</h4>
                      <p className="text-xs font-semibold text-amber-900">{a.reason}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        a.status === 'pending'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : a.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-red-100 text-red-900 border border-red-300'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  <p className="text-xs text-stone-700 bg-white p-3 rounded-xl border border-stone-200 mb-3 leading-relaxed">
                    "{a.details}"
                  </p>

                  {a.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                      <button
                        onClick={() => handleReviewAppeal(a.id, 'rejected')}
                        className="px-3.5 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl text-xs font-semibold"
                      >
                        Reject Appeal
                      </button>
                      <button
                        onClick={() => handleReviewAppeal(a.id, 'approved')}
                        className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs"
                      >
                        Approve & Reactivate User
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: ADMIN AUDIT LOGS                                        */}
      {/* ============================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div>
            <h3 className="font-heading text-lg font-bold text-stone-900">
              Administrative Activity Logs
            </h3>
            <p className="text-xs text-stone-500">
              Permanent security audit trail recording all administrative updates, bans, role edits, and deletions.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Administrator</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150">
                {logList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400">
                      No admin activity logged yet.
                    </td>
                  </tr>
                ) : (
                  logList.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50 transition">
                      <td className="py-2.5 px-3 text-stone-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-stone-800">
                        {log.actorName}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-900 text-[11px]">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 uppercase text-[10px] text-stone-500 font-semibold">
                        {log.targetType}
                      </td>
                      <td className="py-2.5 px-3 text-stone-700 max-w-xs truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 7: KNOWLEDGE TOPICS CRUD                                   */}
      {/* ============================================================== */}
      {activeTab === 'topics' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-stone-900">
                Official Knowledge Base Repository
              </h3>
              <p className="text-xs text-stone-500">
                WNCC AI uses these curriculum topics to ground theological answers with 100% academic accuracy.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTopicQuery}
                  onChange={(e) => setSearchTopicQuery(e.target.value)}
                  placeholder="Search topics..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <button
                onClick={openCreateTopic}
                className="px-4 py-2 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Topic</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTopics.map(t => (
              <div
                key={t.id}
                className="p-4 rounded-xl border border-stone-200 hover:border-amber-700/40 bg-stone-50/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold uppercase">
                      {t.category}
                    </span>
                    <h4 className="font-heading font-bold text-stone-900 text-sm">{t.title}</h4>
                  </div>
                  <p className="text-xs text-stone-600 line-clamp-1">{t.explanation}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditTopic(t)}
                    className="p-2 text-stone-600 hover:text-amber-900 hover:bg-stone-200 rounded-xl transition"
                    title="Edit Topic"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTopic(t.id, t.title)}
                    className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                    title="Delete Topic"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 8: CATEGORIES CRUD                                         */}
      {/* ============================================================== */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="font-heading text-lg font-bold text-stone-900">
              Curriculum Categories
            </h3>
            <p className="text-xs text-stone-500">
              Organize knowledge topics and group channels by theological subject.
            </p>
          </div>

          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              required
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Biblical Greek, Hermeneutics..."
              className="flex-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-800"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Add Category
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <span
                key={c}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-800 border border-stone-200 rounded-xl text-xs font-medium"
              >
                <span>{c}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c)}
                  className="text-stone-400 hover:text-red-700 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 9: ANNOUNCEMENTS                                           */}
      {/* ============================================================== */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
            <div>
              <h3 className="font-heading text-lg font-bold text-stone-900">
                Broadcast Announcement
              </h3>
              <p className="text-xs text-stone-500">
                Instantly notifies all registered college students and scholars.
              </p>
            </div>

            <form onSubmit={handleAddAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. End of Semester Examination Schedule"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Notice Content *</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Detailed college announcement message..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="important-check"
                  checked={annImportant}
                  onChange={(e) => setAnnImportant(e.target.checked)}
                  className="rounded text-amber-900"
                />
                <label htmlFor="important-check" className="text-stone-700 font-semibold cursor-pointer">
                  Mark as High Priority Alert
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Broadcast to Campus
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4">
            <h3 className="font-heading text-lg font-bold text-stone-900">
              Published College Announcements
            </h3>

            <div className="space-y-3">
              {announcements.map(a => (
                <div
                  key={a.id}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {a.important && (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold uppercase">
                          Important
                        </span>
                      )}
                      <h4 className="font-heading font-bold text-stone-900 text-sm">{a.title}</h4>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">{a.content}</p>
                    <p className="text-[10px] text-stone-400">
                      Posted by {a.authorName} on {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(a.id)}
                    className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 10: AI INSTRUCTIONS & SETTINGS                             */}
      {/* ============================================================== */}
      {activeTab === 'ai_settings' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-6 space-y-4 max-w-3xl">
          <div>
            <h3 className="font-heading text-lg font-bold text-stone-900">
              WNCC AI Core Prompt & Behavior Settings
            </h3>
            <p className="text-xs text-stone-500">
              Define the persona, tone, guidelines, and behavioral boundaries injected into the Gemini 3.8 Flash LLM.
            </p>
          </div>

          {aiSettingsSaved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>AI settings saved and activated for all queries!</span>
            </div>
          )}

          <form onSubmit={handleSaveAiSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Custom System Instructions
              </label>
              <textarea
                rows={8}
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-800"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingAiSettings}
                className="px-6 py-2.5 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition"
              >
                {savingAiSettings ? 'Saving...' : 'Save AI Instructions'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 11: PLATFORM STATS & ANALYTICS                             */}
      {/* ============================================================== */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Registered Scholars', value: stats.totalUsers, icon: Users },
            { label: 'Knowledge Topics', value: stats.totalTopics, icon: BookOpen },
            { label: 'Community Posts', value: stats.totalPosts, icon: Megaphone },
            { label: 'Active Study Groups', value: stats.totalGroups, icon: Layers },
            { label: 'AI Conversations', value: stats.totalConversations, icon: Sparkles },
            { label: 'AI Questions Answered', value: stats.totalQuestions, icon: MessageSquare },
            { label: 'Total Reports Filed', value: stats.totalReports || reportList.length, icon: AlertTriangle },
            { label: 'Total Appeals Submitted', value: stats.totalAppeals || appealList.length, icon: Scale }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold font-heading text-stone-900">{item.value}</p>
                <p className="text-xs text-stone-500 font-medium">{item.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TOPIC CREATE/EDIT                                       */}
      {/* ============================================================== */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-stone-200">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <h3 className="font-heading font-bold text-stone-900 text-lg">
                {editingTopicId ? 'Edit Knowledge Topic' : 'Add New Knowledge Topic'}
              </h3>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {topicError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{topicError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Topic Title *</label>
                  <input
                    type="text"
                    required
                    value={topicTitle}
                    onChange={(e) => setTopicTitle(e.target.value)}
                    placeholder="e.g. The Council of Nicaea (AD 325)"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Subject / Course *</label>
                  <input
                    type="text"
                    required
                    value={topicSubject}
                    onChange={(e) => setTopicSubject(e.target.value)}
                    placeholder="e.g. Early Church History"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                <select
                  value={topicCategory}
                  onChange={(e) => setTopicCategory(e.target.value)}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Theological Explanation *</label>
                <textarea
                  rows={3}
                  required
                  value={topicExplanation}
                  onChange={(e) => setTopicExplanation(e.target.value)}
                  placeholder="Clear doctrinal and academic summary..."
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Bible References (comma-separated)</label>
                  <input
                    type="text"
                    value={topicBibleReferences}
                    onChange={(e) => setTopicBibleReferences(e.target.value)}
                    placeholder="e.g. John 1:1, Colossians 1:15-20"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={topicKeywords}
                    onChange={(e) => setTopicKeywords(e.target.value)}
                    placeholder="e.g. homousios, arianism, creed"
                    className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Collegiate Study & Exam Notes</label>
                <textarea
                  rows={2}
                  value={topicNotes}
                  onChange={(e) => setTopicNotes(e.target.value)}
                  placeholder="Key points for exams and ministry application..."
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Supporting Study Material</label>
                <textarea
                  rows={2}
                  value={topicStudyMaterial}
                  onChange={(e) => setTopicStudyMaterial(e.target.value)}
                  placeholder="Detailed notes or primary citations..."
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Search Terms (comma-separated)</label>
                <input
                  type="text"
                  value={topicSearchTerms}
                  onChange={(e) => setTopicSearchTerms(e.target.value)}
                  placeholder="e.g. nicaea, christology, trinitarian"
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-stone-150 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTopic}
                  className="px-6 py-2 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {savingTopic ? 'Saving...' : editingTopicId ? 'Update Topic' : 'Add to Repository'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: BAN USER REASON PROMPT                                  */}
      {/* ============================================================== */}
      {targetUserForBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-stone-900 text-base">
                  Suspend User Account
                </h4>
                <p className="text-xs text-stone-500">
                  {targetUserForBan.displayName} (@{targetUserForBan.username})
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Reason for Suspension (Visible to User upon login attempt)
              </label>
              <textarea
                rows={3}
                value={banReasonInput}
                onChange={(e) => setBanReasonInput(e.target.value)}
                placeholder="State specific reason or violated policy..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-800 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTargetUserForBan(null)}
                className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBanSubmission}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RESOLVE REPORT WITH ACTION NOTE                         */}
      {/* ============================================================== */}
      {resolvingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 p-5 space-y-4">
            <h4 className="font-heading font-bold text-stone-900 text-base">
              Resolve Report: {resolvingReport.reason}
            </h4>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Action Taken / Moderation Note
              </label>
              <input
                type="text"
                value={actionTakenInput}
                onChange={(e) => setActionTakenInput(e.target.value)}
                placeholder="e.g. Warning sent, content deleted, or user advised..."
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolvingReport(null)}
                className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolveReport('resolved')}
                className="px-4 py-2 bg-amber-900 text-white rounded-xl text-xs font-semibold"
              >
                Save Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TRANSFER GROUP OWNERSHIP                                */}
      {/* ============================================================== */}
      {transferGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 p-5 space-y-4">
            <h4 className="font-heading font-bold text-stone-900 text-base">
              Transfer Ownership: {transferGroup.name}
            </h4>
            <p className="text-xs text-stone-500">
              Select a member of the group to assign full Group Owner privileges.
            </p>

            <form onSubmit={handleTransferOwnershipSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Select New Owner
                </label>
                <select
                  required
                  value={newOwnerUserId}
                  onChange={(e) => setNewOwnerUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">-- Choose a user --</option>
                  {userList.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferGroup(null)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newOwnerUserId}
                  className="px-4 py-2 bg-amber-900 hover:bg-amber-850 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  Transfer Ownership
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DESTRUCTIVE CONFIRMATION MODAL                                  */}
      {/* ============================================================== */}
      {confirmationModal && confirmationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-800" />
              </div>
              <h4 className="font-heading font-bold text-stone-900 text-base">
                {confirmationModal.title}
              </h4>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {confirmationModal.message}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-150">
              <button
                type="button"
                onClick={() => setConfirmationModal(null)}
                className="px-4 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmationModal.onConfirm()}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                {confirmationModal.confirmLabel || 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
