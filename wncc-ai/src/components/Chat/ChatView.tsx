import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Conversation, ChatMessage, Topic } from '../../types';
import { marked } from 'marked';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  RotateCcw,
  Square,
  BookOpen,
  ChevronDown,
  Menu,
  X,
  Search,
  MessageSquare,
  GraduationCap,
  Lightbulb,
  Paperclip,
  Code,
  Languages,
  PenTool,
  Brain,
  FileText,
  ShieldCheck,
  ArrowRight,
  Maximize2,
  Minimize2,
  Home,
  Users,
  Layers
} from 'lucide-react';

// Configure marked renderer for ChatGPT-grade code blocks and Scripture blockquotes
const renderer = new marked.Renderer();

renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  const cleanLang = (lang || 'code').trim();
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `
    <div class="code-block-wrapper my-2.5 sm:my-3 rounded-xl overflow-hidden border border-stone-800 bg-stone-900 text-stone-100 shadow-md max-w-full">
      <div class="flex items-center justify-between px-3 py-1.5 bg-stone-950/80 border-b border-stone-800 text-[11px] font-mono text-stone-400">
        <span class="font-bold uppercase tracking-wider text-amber-400">${cleanLang}</span>
        <button type="button" class="copy-code-btn inline-flex items-center gap-1.5 hover:text-white px-2 py-0.5 rounded hover:bg-stone-800 transition cursor-pointer text-[11px]" data-code="${encodeURIComponent(text)}">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          <span class="btn-text">Copy code</span>
        </button>
      </div>
      <pre class="p-3 sm:p-4 overflow-x-auto text-xs font-mono leading-relaxed text-stone-200 max-w-full"><code>${escapedText}</code></pre>
    </div>
  `;
};

renderer.blockquote = function({ text }: { text: string }) {
  return `<blockquote class="my-2.5 sm:my-3 pl-3 sm:pl-4 border-l-4 border-amber-800 bg-amber-50/70 py-2 sm:py-2.5 pr-2.5 sm:pr-3 rounded-r-xl italic text-amber-950 font-serif text-xs sm:text-sm break-words">${text}</blockquote>`;
};

marked.setOptions({ renderer });

interface ChatViewProps {
  initialTopicContext?: Topic | null;
  onClearInitialTopic?: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  initialTopicContext,
  onClearInitialTopic,
  onNavigateTab
}) => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [promptMode, setPromptMode] = useState<'standard' | 'simple' | 'exam' | 'reasoning'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showScrollBottomPill, setShowScrollBottomPill] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Attached media/file
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Global click delegate for "Copy Code" buttons inside marked output
  useEffect(() => {
    const handleCodeCopyClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('.copy-code-btn') as HTMLElement | null;
      if (!target) return;

      const rawCode = target.getAttribute('data-code');
      if (rawCode) {
        const decoded = decodeURIComponent(rawCode);
        navigator.clipboard.writeText(decoded);
        const textSpan = target.querySelector('.btn-text');
        if (textSpan) {
          const original = textSpan.textContent;
          textSpan.textContent = 'Copied!';
          target.classList.add('text-emerald-400');
          setTimeout(() => {
            textSpan.textContent = original;
            target.classList.remove('text-emerald-400');
          }, 2000);
        }
      }
    };

    document.addEventListener('click', handleCodeCopyClick);
    return () => document.removeEventListener('click', handleCodeCopyClick);
  }, []);

  // Load conversations on mount or auth change
  useEffect(() => {
    loadConversations();
  }, [user]);

  // Topic context injection if user came from Topics directory
  useEffect(() => {
    if (initialTopicContext) {
      const prompt = `Please provide an in-depth academic study guide on "${initialTopicContext.title}" (${initialTopicContext.subject}). Include its key scriptural pillars (${initialTopicContext.bibleReferences.join(', ')}), historical context, and how it applies to Christian ministry.`;
      setInputText(prompt);
      if (onClearInitialTopic) onClearInitialTopic();
    }
  }, [initialTopicContext]);

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
      if (res.conversations.length > 0) {
        // If no active or previous is invalid, select newest
        if (!activeConversationId || !res.conversations.some(c => c.id === activeConversationId)) {
          setActiveConversationId(res.conversations[0].id);
          setActiveConversation(res.conversations[0]);
        } else {
          const current = res.conversations.find(c => c.id === activeConversationId);
          if (current) setActiveConversation(current);
        }
      } else {
        setActiveConversation(null);
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleSelectConversation = async (convoId: string) => {
    setActiveConversationId(convoId);
    setSidebarOpen(false);
    try {
      const res = await api.getConversation(convoId);
      setActiveConversation(res.conversation);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await api.createConversation();
      setConversations(prev => [res.conversation, ...prev]);
      setActiveConversationId(res.conversation.id);
      setActiveConversation(res.conversation);
      setSidebarOpen(false);
      setInputText('');
      setAttachedImage(null);
      setAttachedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleDeleteConversation = async (convoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convoId);
      setConversations(prev => prev.filter(c => c.id !== convoId));
      if (activeConversationId === convoId) {
        const remaining = conversations.filter(c => c.id !== convoId);
        if (remaining.length > 0) {
          handleSelectConversation(remaining[0].id);
        } else {
          setActiveConversation(null);
          setActiveConversationId(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleRename = async (convoId: string) => {
    if (!renameTitle.trim()) {
      setRenameId(null);
      return;
    }
    try {
      await api.renameConversation(convoId, renameTitle.trim());
      setConversations(prev => prev.map(c => c.id === convoId ? { ...c, title: renameTitle.trim() } : c));
      if (activeConversation?.id === convoId) {
        setActiveConversation(prev => prev ? { ...prev, title: renameTitle.trim() } : null);
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    } finally {
      setRenameId(null);
      setRenameTitle('');
    }
  };

  const scrollToBottom = (smooth = true) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      }
    }, 50);
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottomPill(!isNearBottom);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachedFile({
          name: file.name,
          content: (event.target?.result as string) || ''
        });
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if ((!messageContent && !attachedImage && !attachedFile) || isGenerating) return;

    // Reset input states
    setInputText('');
    const curImg = attachedImage;
    const curFile = attachedFile;
    setAttachedImage(null);
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Assemble final user prompt if file was attached
    let finalPrompt = messageContent;
    if (curFile) {
      finalPrompt = `${finalPrompt}\n\n[Attached File: ${curFile.name}]\n\`\`\`\n${curFile.content.slice(0, 15000)}\n\`\`\``;
    }

    // Apply prompt mode prefixes if user selected specific mode
    if (promptMode === 'simple' && !finalPrompt.toLowerCase().includes('explain simply')) {
      finalPrompt = `[Instruction: Explain in simple, clear, accessible terms for beginners without sacrificing theological or conceptual accuracy]\n\n${finalPrompt}`;
    } else if (promptMode === 'exam' && !finalPrompt.toLowerCase().includes('exam answer')) {
      finalPrompt = `[Instruction: Structure this answer as an academic exam essay with definitions, key arguments, counter-arguments, and a solid conclusion]\n\n${finalPrompt}`;
    } else if (promptMode === 'reasoning' && !finalPrompt.toLowerCase().includes('step-by-step')) {
      finalPrompt = `[Instruction: Provide detailed step-by-step reasoning, explaining the underlying principles and logical inferences]\n\n${finalPrompt}`;
    }

    let convoId = activeConversationId;
    let currentConvo = activeConversation;

    // Create session if none exists
    if (!convoId || !currentConvo) {
      try {
        const newConvoRes = await api.createConversation(messageContent.slice(0, 45) || 'New Inquiry');
        convoId = newConvoRes.conversation.id;
        currentConvo = newConvoRes.conversation;
        setActiveConversationId(convoId);
        setActiveConversation(currentConvo);
        setConversations(prev => [newConvoRes.conversation, ...prev]);
      } catch (err) {
        console.error('Failed to create new conversation session:', err);
        return;
      }
    }

    // Local optimistic user message
    const tempUserMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: tempUserMsgId,
      role: 'user',
      content: finalPrompt,
      timestamp: new Date().toISOString(),
      imageUrl: curImg || undefined
    };

    // Placeholder assistant message for SSE streaming chunks
    const tempAiMsgId = `ai-${Date.now()}`;
    const aiMsg: ChatMessage = {
      id: tempAiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true
    };

    setActiveConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, userMsg, aiMsg]
      };
    });

    scrollToBottom();
    setIsGenerating(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      await api.sendMessageStream(
        convoId,
        finalPrompt,
        promptMode,
        curImg || undefined,
        (chunk: string) => {
          setActiveConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map(m => {
                if (m.id === tempAiMsgId) {
                  return { ...m, content: (m.content || '') + chunk };
                }
                return m;
              })
            };
          });
        },
        (doneData: any) => {
          setIsGenerating(false);
          setActiveConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              title: doneData.conversationTitle || prev.title,
              messages: prev.messages.map(m => {
                if (m.id === tempAiMsgId) {
                  return {
                    ...m,
                    id: doneData.messageId || m.id,
                    content: doneData.content || m.content,
                    bibleReferences: doneData.bibleReferences,
                    relatedTopics: doneData.relatedTopics,
                    isStreaming: false
                  };
                }
                return m;
              })
            };
          });

          // Update sidebar title if modified
          if (doneData.conversationTitle) {
            setConversations(prev =>
              prev.map(c => c.id === convoId ? { ...c, title: doneData.conversationTitle } : c)
            );
          }
          scrollToBottom();
        },
        abortController.signal
      );
    } catch (err) {
      console.error('Send message failure:', err);
      setIsGenerating(false);
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map(m => {
            if (m.id === tempAiMsgId) {
              return {
                ...m,
                content: m.content || 'An unexpected interruption occurred. Please tap Regenerate or try again.',
                isStreaming: false
              };
            }
            return m;
          })
        };
      });
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setActiveConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: prev.messages.map(m => (m.isStreaming ? { ...m, isStreaming: false } : m))
      };
    });
  };

  const handleRegenerate = async () => {
    if (!activeConversation || isGenerating) return;
    const msgs = activeConversation.messages;
    if (msgs.length === 0) return;

    // Find the last user message
    let lastUserIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }

    if (lastUserIdx === -1) return;
    const userPrompt = msgs[lastUserIdx].content;

    // Strip assistant replies after this prompt
    const truncated = msgs.slice(0, lastUserIdx);
    setActiveConversation(prev => prev ? { ...prev, messages: truncated } : null);

    // Resend
    handleSendMessage(userPrompt);
  };

  const handleCopy = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  const handleStartEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleSaveEdit = (messageId: string) => {
    if (!activeConversation) return;
    const msgIdx = activeConversation.messages.findIndex(m => m.id === messageId);
    if (msgIdx === -1) return;

    // Truncate everything after this message and resend edited content
    const truncated = activeConversation.messages.slice(0, msgIdx);
    setActiveConversation(prev => prev ? { ...prev, messages: truncated } : null);
    setEditingMessageId(null);

    handleSendMessage(editingContent);
  };

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={`flex w-full max-w-7xl mx-auto overflow-hidden bg-stone-50 md:border-x border-stone-200 transition-all ${
        isFullScreen
          ? 'fixed inset-0 z-50 h-[100dvh] max-w-none border-0'
          : 'h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]'
      }`}
    >
      {/* Sidebar - Sessions & Chat History Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-white border-r border-stone-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-3.5 border-b border-stone-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-800" />
              <span>Chat History</span>
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-3 bg-amber-900 hover:bg-amber-850 active:bg-amber-950 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 overscroll-contain">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-stone-500 font-medium">No chats yet</p>
              <p className="text-[11px] text-stone-400 mt-1">Start a conversation on any topic.</p>
            </div>
          ) : (
            filteredConversations.map((convo) => {
              const isActive = activeConversationId === convo.id;
              const isRenaming = renameId === convo.id;

              return (
                <div
                  key={convo.id}
                  onClick={() => !isRenaming && handleSelectConversation(convo.id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition ${
                    isActive
                      ? 'bg-amber-100/70 text-amber-950 font-semibold border border-amber-200'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-1">
                    <Sparkles className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-amber-800' : 'text-stone-400'}`} />
                    {isRenaming ? (
                      <input
                        type="text"
                        autoFocus
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onBlur={() => handleRename(convo.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(convo.id)}
                        className="w-full py-0.5 px-1 bg-white border border-amber-400 rounded text-xs focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{convo.title || 'Untitled Session'}</span>
                    )}
                  </div>

                  <div className={`items-center gap-1 ${isActive ? 'flex' : 'hidden group-hover:flex'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameId(convo.id);
                        setRenameTitle(convo.title);
                      }}
                      className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-white/80 cursor-pointer"
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(convo.id, e)}
                      className="p-1 text-stone-400 hover:text-red-700 rounded hover:bg-white/80 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Platform Navigation Links for Mobile Drawer */}
        {onNavigateTab && (
          <div className="p-2.5 border-t border-stone-200 bg-stone-50/40 space-y-1">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2 block">
              College Campus
            </span>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  onNavigateTab('home');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:bg-amber-100/60 hover:text-amber-950 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-stone-500" />
                <span>Home Feed</span>
              </button>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  onNavigateTab('community');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:bg-amber-100/60 hover:text-amber-950 transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-stone-500" />
                <span>Community</span>
              </button>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  onNavigateTab('topics');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:bg-amber-100/60 hover:text-amber-950 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                <span>Topics</span>
              </button>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  onNavigateTab('groups');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-700 hover:bg-amber-100/60 hover:text-amber-950 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-stone-500" />
                <span>Groups</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer info in drawer */}
        <div className="p-3 border-t border-stone-200 bg-stone-50/80 text-[11px] text-stone-500 flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium text-stone-600">
            <GraduationCap className="w-3.5 h-3.5 text-amber-800" />
            <span>WNCC Intelligence</span>
          </span>
          <span className="font-semibold text-emerald-700 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Standalone AI</span>
          </span>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        />
      )}

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full bg-white relative min-w-0">
        {/* Top Header */}
        <div className="h-14 sm:h-14 border-b border-stone-200 px-3 sm:px-4 flex items-center justify-between bg-white/95 backdrop-blur-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl cursor-pointer flex-shrink-0"
              aria-label="Open chat sessions history"
              title="Chat History"
            >
              <Menu className="w-5 h-5" />
            </button>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('home')}
                className="p-2 text-stone-500 hover:text-amber-900 hover:bg-amber-50 rounded-xl transition cursor-pointer flex-shrink-0 md:hidden"
                aria-label="Back to Home Feed"
                title="Back to Home"
              >
                <Home className="w-4 h-4" />
              </button>
            )}

            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="overflow-hidden min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-stone-900 truncate flex items-center gap-1.5">
                <span className="truncate">{activeConversation?.title || 'WNCC AI Assistant'}</span>
              </h1>
              <p className="text-[10px] text-stone-500 font-medium truncate hidden sm:block">
                Standalone AI: Theology, Coding, Academics, Writing, Research & Reasoning
              </p>
              <p className="text-[10px] text-amber-800 font-semibold truncate sm:hidden">
                WNCC Standalone Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Fullscreen Expand/Collapse Button */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-stone-500 hover:text-amber-900 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              aria-label={isFullScreen ? 'Exit full screen' : 'Full screen view'}
              title={isFullScreen ? 'Exit full screen' : 'Full screen view'}
            >
              {isFullScreen ? (
                <Minimize2 className="w-4 h-4 text-amber-900" />
              ) : (
                <Maximize2 className="w-4 h-4 text-stone-600" />
              )}
            </button>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="px-2.5 py-1.5 bg-amber-900 hover:bg-amber-850 active:bg-amber-950 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 relative overscroll-contain"
        >
          {(!activeConversation || activeConversation.messages.length === 0) ? (
            /* Standalone ChatGPT-Style Landing Hero with Multi-Category Ideas */
            <div className="max-w-2xl mx-auto py-4 sm:py-8 text-center space-y-4 sm:space-y-6 animate-in fade-in duration-300">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-amber-900 text-amber-100 shadow-md">
                <Brain className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>

              <div>
                <h2 className="text-xl sm:text-3xl font-bold font-serif-heading text-stone-900 px-2">
                  How can WNCC AI help you today?
                </h2>
                <p className="text-stone-600 text-xs sm:text-sm mt-1.5 max-w-lg mx-auto leading-relaxed px-2">
                  Ask any question without restrictions. Deep theological exegesis, computer programming, exam preparation, sermon outlines, academic research, or everyday reasoning.
                </p>
              </div>

              {/* Multi-Domain Interactive Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-left">
                {[
                  {
                    icon: BookOpen,
                    category: 'Biblical Exegesis',
                    title: 'What is justification?',
                    query: 'What is justification in Christian theology? Explain the Greek word dikaiosis and key scriptures.'
                  },
                  {
                    icon: GraduationCap,
                    category: 'Exam Revision',
                    title: 'Synoptic Problem & Q Source',
                    query: 'Explain the Synoptic Problem and the Two-Source Hypothesis as an exam essay with definitions and arguments.'
                  },
                  {
                    icon: Code,
                    category: 'Programming & STEM',
                    title: 'TypeScript Debounce & Algorithms',
                    query: 'Write a clean TypeScript debounce function with type safety, and explain how it prevents API thrashing.'
                  },
                  {
                    icon: PenTool,
                    category: 'Writing & Homiletics',
                    title: 'Expository Sermon Outline',
                    query: 'Create a 3-point expository sermon outline on Philippians 4:4-7 with homiletical big idea and pastoral applications.'
                  },
                  {
                    icon: Languages,
                    category: 'Church History & Restoration',
                    title: 'Council of Nicaea (325 AD)',
                    query: 'Explain the theological controversy of Arianism and the outcomes of the Council of Nicaea in 325 AD.'
                  },
                  {
                    icon: Brain,
                    category: 'Logic & Reasoning',
                    title: 'Inductive vs Deductive Reasoning',
                    query: 'Explain the principles of inductive vs deductive reasoning with academic and real-world examples.'
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.query)}
                      className="p-3 sm:p-3.5 bg-stone-50 hover:bg-amber-50/80 border border-stone-200 hover:border-amber-300 rounded-xl sm:rounded-2xl transition text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-4 h-4 text-amber-800" />
                        <span className="text-[10px] font-bold text-amber-900 uppercase">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-stone-900 group-hover:text-amber-900 transition flex items-center justify-between">
                        <span>{item.title}</span>
                        <ArrowRight className="w-3 h-3 text-stone-400 group-hover:text-amber-800 transition" />
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-1">
                        {item.query}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Active Messages List */
            activeConversation.messages.map((message) => {
              const isUser = message.role === 'user';
              const isEditing = editingMessageId === message.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'} w-full`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                      <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  )}

                  <div className={`max-w-[95%] sm:max-w-[85%] md:max-w-[80%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
                    {isEditing ? (
                      <div className="bg-white border border-amber-300 rounded-2xl p-3 shadow-md w-full">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          className="w-full text-xs sm:text-sm bg-transparent border-0 focus:outline-none resize-none"
                          rows={3}
                        />
                        <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-stone-100">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(message.id)}
                            className="px-3 py-1 bg-amber-900 text-white text-xs font-semibold rounded-lg hover:bg-amber-850 cursor-pointer"
                          >
                            Save & Resend
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`rounded-2xl p-3 sm:p-5 shadow-xs overflow-hidden break-words ${
                          isUser
                            ? 'bg-amber-900 text-white rounded-tr-xs'
                            : 'bg-stone-50 border border-stone-200/80 text-stone-900 rounded-tl-xs'
                        }`}
                      >
                        {/* Attached Image */}
                        {message.imageUrl && (
                          <div className="mb-2.5 rounded-xl overflow-hidden max-h-64 border border-white/20">
                            <img src={message.imageUrl} alt="Attached" className="w-full h-auto max-h-64 object-contain" />
                          </div>
                        )}

                        {isUser ? (
                          <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                            {message.content}
                          </div>
                        ) : message.isStreaming && !message.content ? (
                          <div className="flex items-center gap-2 py-2 text-stone-500 text-xs">
                            <div className="w-2 h-2 rounded-full bg-amber-700 animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-amber-700 animate-pulse delay-75" />
                            <div className="w-2 h-2 rounded-full bg-amber-700 animate-pulse delay-150" />
                            <span className="font-medium ml-1">WNCC AI is reasoning...</span>
                          </div>
                        ) : (
                          <div
                            className="markdown-body text-xs sm:text-sm text-stone-800 break-words overflow-hidden"
                            dangerouslySetInnerHTML={{
                              __html: marked.parse(message.content, { async: false }) as string
                            }}
                          />
                        )}

                        {/* Interactive Biblical Citations */}
                        {!isUser && message.bibleReferences && message.bibleReferences.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-amber-900 flex items-center gap-1 mr-1 flex-shrink-0">
                              <BookOpen className="w-3 h-3" />
                              Scriptures:
                            </span>
                            {message.bibleReferences.map((ref, rIdx) => (
                              <button
                                key={rIdx}
                                onClick={() => handleSendMessage(`Please explain the scriptural context, Greek/Hebrew nuances, and meaning of ${ref} in detail.`)}
                                className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200 rounded-md text-[11px] font-semibold transition cursor-pointer max-w-full truncate"
                                title={`Ask WNCC AI about ${ref}`}
                              >
                                {ref}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Related Knowledge Topics */}
                        {!isUser && message.relatedTopics && message.relatedTopics.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-stone-500">
                            <span className="text-[10px] uppercase font-bold text-stone-400 mr-1 flex-shrink-0">Related:</span>
                            {message.relatedTopics.map((topTitle, tIdx) => (
                              <button
                                key={tIdx}
                                onClick={() => handleSendMessage(`Provide an in-depth theological study and ministerial application of ${topTitle}.`)}
                                className="px-2 py-0.5 bg-stone-200/70 hover:bg-stone-300 text-stone-700 rounded-md transition cursor-pointer max-w-full truncate"
                              >
                                {topTitle}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Toolbar */}
                    <div className="flex items-center gap-2 mt-1.5 px-1 text-[11px] text-stone-400">
                      <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                      {isUser && !isEditing && (
                        <button
                          onClick={() => handleStartEdit(message)}
                          className="hover:text-stone-700 flex items-center gap-1 ml-2 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}

                      {!isUser && !message.isStreaming && (
                        <div className="flex items-center gap-3 ml-2">
                          <button
                            onClick={() => handleCopy(message.id, message.content)}
                            className="hover:text-stone-800 flex items-center gap-1 transition cursor-pointer"
                            title="Copy response"
                          >
                            {copiedMessageId === message.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600 font-medium">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleRegenerate}
                            className="hover:text-stone-800 flex items-center gap-1 transition cursor-pointer"
                            title="Regenerate this response"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Regenerate</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-stone-200 text-stone-700 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden font-bold text-xs">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{user?.displayName?.[0] || 'U'}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Jump to bottom */}
        {showScrollBottomPill && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-amber-900 text-white rounded-full text-xs font-semibold shadow-lg hover:bg-amber-850 flex items-center gap-1.5 animate-bounce cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>↓ New message</span>
          </button>
        )}

        {/* Stop Generation Button */}
        {isGenerating && (
          <div className="px-3 sm:px-4 py-1.5 flex justify-center bg-stone-50 border-t border-stone-100 flex-shrink-0">
            <button
              onClick={handleStopGeneration}
              className="px-3 py-1 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Square className="w-3 h-3 text-red-600 fill-red-600" />
              <span>Stop generation</span>
            </button>
          </div>
        )}

        {/* Input Bar with File & Gallery attachment */}
        <div className="p-2 sm:p-4 bg-white border-t border-stone-200 flex-shrink-0">
          {/* Quick Response Modes */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1.5 sm:pb-2 text-xs scrollbar-none touch-pan-x">
            <span className="text-[10px] sm:text-[11px] font-semibold text-stone-400 mr-0.5 sm:mr-1 flex items-center gap-1 flex-shrink-0">
              <Lightbulb className="w-3 h-3 text-amber-700" /> Mode:
            </span>
            <button
              type="button"
              onClick={() => setPromptMode('standard')}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 transition cursor-pointer ${
                promptMode === 'standard'
                  ? 'bg-amber-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setPromptMode('simple')}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 transition cursor-pointer ${
                promptMode === 'simple'
                  ? 'bg-amber-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Explain Simply
            </button>
            <button
              type="button"
              onClick={() => setPromptMode('exam')}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 transition cursor-pointer ${
                promptMode === 'exam'
                  ? 'bg-amber-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Give Exam Answer
            </button>
            <button
              type="button"
              onClick={() => setPromptMode('reasoning')}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap flex-shrink-0 transition cursor-pointer ${
                promptMode === 'reasoning'
                  ? 'bg-amber-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Step-by-Step Reasoning
            </button>
          </div>

          {/* Attached Image or File Preview */}
          {attachedImage && (
            <div className="relative inline-block mb-1.5 sm:mb-2 rounded-xl overflow-hidden border border-stone-300 max-h-20 sm:max-h-24">
              <img src={attachedImage} alt="Attachment" className="h-16 sm:h-20 w-auto object-cover" />
              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {attachedFile && (
            <div className="inline-flex items-center gap-2 mb-1.5 sm:mb-2 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900">
              <FileText className="w-3.5 h-3.5 text-amber-800" />
              <span className="font-semibold truncate max-w-[200px]">{attachedFile.name}</span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="p-0.5 text-stone-400 hover:text-stone-700 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Multiline Input Box with Gallery File & Image Upload */}
          <div className="relative flex items-end gap-1.5 sm:gap-2 bg-stone-50 border border-stone-300 rounded-2xl p-1.5 sm:p-2 focus-within:bg-white focus-within:border-amber-800 focus-within:ring-2 focus-within:ring-amber-800/10 transition shadow-xs">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg,.txt,.md,.py,.ts,.js,.json,.csv,.sql"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 sm:p-2 text-stone-500 hover:text-amber-900 hover:bg-stone-200/60 rounded-xl transition flex-shrink-0 cursor-pointer"
              title="Attach photo, manuscript, code file, or study notes"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything (theology, code, assignments, sermons, research)..."
              className="flex-1 max-h-32 sm:max-h-40 py-1 sm:py-1.5 px-1.5 sm:px-2 bg-transparent text-xs sm:text-sm text-stone-900 focus:outline-none resize-none placeholder-stone-400"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={(!inputText.trim() && !attachedImage && !attachedFile) || isGenerating}
              className="p-2 sm:p-2.5 bg-amber-900 hover:bg-amber-850 active:bg-amber-950 text-white rounded-xl disabled:opacity-30 disabled:pointer-events-none transition-all flex-shrink-0 shadow-xs cursor-pointer"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1 sm:mt-1.5 px-1">
            <span className="truncate">Gemini 3.8 Intelligence</span>
            <span className="hidden sm:inline">Shift + Enter for new line</span>
            <span className="sm:hidden text-stone-400">Standalone AI</span>
          </div>
        </div>
      </main>
    </div>
  );
};
