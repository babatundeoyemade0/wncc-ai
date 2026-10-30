import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { DirectMessage, MessageAttachment, User } from '../../types';
import { AttachmentViewer } from '../Common/AttachmentViewer';
import { ReportModal } from '../ReportModal';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Search,
  Users,
  Paperclip,
  Trash2,
  Reply,
  X,
  Flag,
  CheckCheck,
  Clock
} from 'lucide-react';

interface MessagesViewProps {
  initialChatUserId?: string | null;
  onClearInitialChatUser?: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  initialChatUserId,
  onClearInitialChatUser
}) => {
  const { user, openAuthModal, isSuperAdmin } = useAuth();

  const [threads, setThreads] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Rich Attachments State
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<DirectMessage | null>(null);

  // Reporting
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [user]);

  useEffect(() => {
    if (initialChatUserId && user) {
      handleOpenChatWithUser(initialChatUserId);
      if (onClearInitialChatUser) onClearInitialChatUser();
    }
  }, [initialChatUserId, user]);

  const loadThreads = async () => {
    setLoadingThreads(true);
    try {
      const res = await api.getMessageThreads();
      setThreads(res.threads);
      if (res.threads.length > 0 && !selectedUser && !initialChatUserId) {
        setSelectedUser(res.threads[0].user);
        loadMessages(res.threads[0].user.id);
      }
    } catch (err) {
      console.error('Failed to load message threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  const handleOpenChatWithUser = async (targetId: string) => {
    try {
      const res = await api.getUserProfile(targetId);
      setSelectedUser(res.user);
      loadMessages(res.user.id);
      setPendingAttachments([]);
      setReplyingToMessage(null);
    } catch (err) {
      console.error('Error fetching chat user:', err);
    }
  };

  const loadMessages = async (partnerId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.getDirectMessages(partnerId);
      setMessages(res.messages);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasText = inputText.trim().length > 0;
    const hasAtt = pendingAttachments.length > 0;
    if ((!hasText && !hasAtt) || !selectedUser || !user) return;

    const text = inputText.trim();
    const attachmentsToSend = [...pendingAttachments];
    const replyRef = replyingToMessage ? {
      id: replyingToMessage.id,
      senderName: replyingToMessage.senderId === user.id ? 'You' : selectedUser.displayName,
      content: replyingToMessage.content || 'Attachment'
    } : undefined;

    setInputText('');
    setPendingAttachments([]);
    setReplyingToMessage(null);

    try {
      const res = await api.sendDirectMessage(
        selectedUser.id,
        text,
        attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
        replyRef
      );
      setMessages(prev => [...prev, res.message]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      loadThreads();
    } catch (err: any) {
      alert(err.message || 'Failed to send direct message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.deleteDirectMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      loadThreads();
    } catch (err: any) {
      alert(err.message || 'Failed to delete message.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold font-serif-heading text-stone-900">Direct Messages</h2>
        <p className="text-xs text-stone-500 mt-1 mb-6">
          Sign in to exchange private messages, theological research, and media with fellow scholars.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-amber-900 text-white rounded-xl text-xs font-semibold shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  const filteredThreads = threads.filter(t =>
    t.user.displayName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    t.user.username.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-6 py-4 pb-24 md:pb-6 h-[calc(100vh-4.5rem)]">
      <div className="bg-white border border-stone-200 rounded-3xl h-full overflow-hidden shadow-xs flex">
        {/* Left Threads Column */}
        <div
          className={`w-full md:w-80 border-r border-stone-200 flex flex-col h-full bg-stone-50/50 ${
            selectedUser ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-stone-200 bg-white">
            <h2 className="text-base font-bold text-stone-900 font-serif-heading flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-800" />
              <span>Direct Messages</span>
            </h2>
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingThreads ? (
              <div className="p-4 text-center text-xs text-stone-400">Loading messages...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-500 font-medium">No messages yet</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Start a conversation from any student or faculty profile.
                </p>
              </div>
            ) : (
              filteredThreads.map((t) => {
                const isSelected = selectedUser?.id === t.user.id;
                const lastMsg = t.lastMessage;
                const hasAttachment = lastMsg?.attachments && lastMsg.attachments.length > 0;

                return (
                  <div
                    key={t.user.id}
                    onClick={() => {
                      setSelectedUser(t.user);
                      loadMessages(t.user.id);
                      setPendingAttachments([]);
                      setReplyingToMessage(null);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-100/70 border border-amber-300'
                        : 'hover:bg-white hover:shadow-2xs'
                    }`}
                  >
                    <img
                      src={t.user.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-stone-200"
                    />
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-stone-900 truncate">{t.user.displayName}</p>
                        <span className="text-[10px] text-stone-400">
                          {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {hasAttachment && !lastMsg.content ? `[${lastMsg.attachments.length} attachment(s)]` : lastMsg.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Window */}
        <div className={`flex-1 flex flex-col h-full bg-white ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="h-16 px-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden p-2 text-stone-500 hover:bg-stone-200 rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={selectedUser.avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-xl object-cover border border-stone-200"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 leading-tight">
                      {selectedUser.displayName}
                    </h3>
                    <p className="text-[10px] text-stone-400">@{selectedUser.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="p-2 text-stone-400 hover:text-red-700 rounded-xl transition"
                    title="Report User"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {loadingMessages ? (
                  <div className="text-center py-8 text-xs text-stone-400">Loading conversation...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-stone-400 text-xs">
                    <p>No messages yet with {selectedUser.displayName}.</p>
                    <p className="text-[11px] mt-1 text-stone-300">Say hello and start the discussion!</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user.id;
                    const canDelete = isMe || isSuperAdmin;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {/* Reply Context */}
                        {m.replyTo && (
                          <div
                            className={`mb-1 p-2 rounded-lg text-[10px] border-l-2 max-w-[75%] ${
                              isMe
                                ? 'bg-amber-100 text-amber-900 border-amber-800'
                                : 'bg-stone-100 text-stone-700 border-stone-400'
                            }`}
                          >
                            <span className="font-bold">{m.replyTo.senderName}: </span>
                            <span className="truncate">{m.replyTo.content}</span>
                          </div>
                        )}

                        <div
                          className={`max-w-[80%] sm:max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-amber-900 text-white rounded-tr-xs'
                              : 'bg-stone-100 text-stone-900 rounded-tl-xs'
                          }`}
                        >
                          {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}

                          {/* Render Rich Attachments */}
                          <AttachmentViewer attachments={m.attachments} />
                        </div>

                        {/* Timestamp & Actions */}
                        <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-stone-400">
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setReplyingToMessage(m)}
                              className="hover:text-amber-900 flex items-center gap-0.5"
                            >
                              <Reply className="w-3 h-3" />
                              <span>Reply</span>
                            </button>

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(m.id)}
                                className="hover:text-red-700 flex items-center gap-0.5 ml-1"
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
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-stone-200 bg-white space-y-2">
                {/* Reply Indicator Strip */}
                {replyingToMessage && (
                  <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <Reply className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                      <span className="font-semibold text-stone-800">
                        Replying to {replyingToMessage.senderId === user.id ? 'yourself' : selectedUser.displayName}:
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

                {/* Pending Attachments Strip */}
                {pendingAttachments.length > 0 && (
                  <AttachmentViewer
                    attachments={pendingAttachments}
                    isEditable={true}
                    onRemove={(id) => setPendingAttachments(prev => prev.filter(a => a.id !== id))}
                  />
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <label
                    className="p-2.5 text-stone-500 hover:text-amber-900 hover:bg-stone-100 rounded-xl cursor-pointer transition"
                    title="Attach Images, Audio, Videos, PDFs, Word documents"
                  >
                    <Paperclip className="w-4 h-4" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Message ${selectedUser.displayName}...`}
                    className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white"
                  />

                  <button
                    type="submit"
                    disabled={uploadingFiles || (!inputText.trim() && pendingAttachments.length === 0)}
                    className="p-2.5 bg-amber-900 hover:bg-amber-850 text-white rounded-xl disabled:opacity-40 transition shadow-xs flex items-center justify-center"
                  >
                    {uploadingFiles ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-stone-400">
              <MessageSquare className="w-12 h-12 mb-3 text-stone-200" />
              <h3 className="text-sm font-bold text-stone-700">Select a conversation</h3>
              <p className="text-xs text-stone-400 mt-1 max-w-xs">
                Pick a study partner from the left or visit a profile to begin messaging.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {selectedUser && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="user"
          targetId={selectedUser.id}
          targetSummary={`User: ${selectedUser.displayName} (@${selectedUser.username})`}
        />
      )}
    </div>
  );
};
