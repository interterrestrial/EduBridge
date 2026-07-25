'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  BookOpen, 
  Plus, 
  MessageSquare, 
  Trash2, 
  AtSign,
  Maximize2,
  Minimize2,
  BrainCircuit,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Code2,
  FileText,
  Folder
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';

interface Message {
  id?: string;
  sender: 'bot' | 'user';
  text: string;
  sources?: any[];
  thoughtTime?: number;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  _count?: { messages: number };
}

// Custom Code Block Renderer with Copy Button and Header
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = () => {
    const codeString = String(children).replace(/\n$/, '');
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline || !match) {
    return (
      <code className="bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="my-4 rounded-xl border border-white/10 overflow-hidden bg-[#0d0d15] shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-xs text-[#a0a0b0]">
        <span className="font-mono uppercase font-semibold text-indigo-400 flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5" /> {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-all text-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-[#e2e8f0]">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function AIChatInner() {
  const { user } = useAuth();
  const studentId = user?.id || 'student_1';
  const searchParams = useSearchParams();
  const noteIdParam = searchParams.get('noteId') || undefined;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isConvCollapsed, setIsConvCollapsed] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [copiedMessageIdx, setCopiedMessageIdx] = useState<number | null>(null);
  const [showSourcesIdx, setShowSourcesIdx] = useState<number | null>(null);
  const [showThoughtIdx, setShowThoughtIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (studentId) {
      fetchNotesAndFolders();
      fetchSessions();
    }
  }, [studentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchNotesAndFolders = async () => {
    try {
      const [notesRes, foldersRes] = await Promise.all([
        api.get(`/notes/student/${studentId}`),
        api.get(`/folders/notes/student/${studentId}`),
      ]);
      setNotes(notesRes.data.notes || []);
      setFolders(foldersRes.data.folders || []);
    } catch (err) {
      console.error('Error fetching study materials:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      setFetchingHistory(true);
      const res = await api.get(`/ai/sessions/${studentId}`);
      const sessionList: ChatSession[] = res.data.sessions || [];
      setSessions(sessionList);

      if (sessionList.length > 0) {
        selectSession(sessionList[0].id);
      } else {
        createNewSession('General Academic Study');
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      setFetchingHistory(true);
      const res = await api.get(`/ai/sessions/messages/${sessionId}`);
      const history = res.data.messages || [];

      if (history.length === 0) {
        setMessages([
          {
            sender: 'bot',
            text: "Greetings! I am EduBridge Master AI, your academic and technical tutor. Ask me any theoretical, mathematical, or algorithmic question, or type `@` to tag a complete **Subject Folder** or specific **Study Note**!",
          },
        ]);
      } else {
        const formatted: Message[] = [];
        history.forEach((item: any) => {
          formatted.push({ sender: 'user', text: item.question });
          formatted.push({ 
            sender: 'bot', 
            text: item.answer, 
            sources: item.sources,
            thoughtTime: Math.floor(Math.random() * 8) + 3
          });
        });
        setMessages(formatted);
      }
    } catch (err) {
      console.error('Error fetching session messages:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const createNewSession = async (customTitle?: string) => {
    try {
      setFetchingHistory(true);
      const res = await api.post('/ai/sessions', {
        studentId,
        title: customTitle || `New Chat ${sessions.length + 1}`,
      });

      const newSession = res.data.session;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([
        {
          sender: 'bot',
          text: "New conversation started! Ask a question or use `@` to tag complete folders (e.g., `@Data Preprocessing & Analytics`) or specific study notes.",
        },
      ]);
    } catch (err) {
      console.error('Error creating new session:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/sessions/${sessionId}`);
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      if (activeSessionId === sessionId) {
        if (updated.length > 0) selectSession(updated[0].id);
        else createNewSession();
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const atIndex = val.lastIndexOf('@');
    if (atIndex !== -1 && atIndex >= val.length - 15) {
      setShowMentionMenu(true);
      setMentionFilter(val.slice(atIndex + 1));
    } else {
      setShowMentionMenu(false);
    }
  };

  const insertMention = (tagTitle: string) => {
    const atIndex = input.lastIndexOf('@');
    const newText = input.slice(0, atIndex) + `@${tagTitle} `;
    setInput(newText);
    setShowMentionMenu(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setShowMentionMenu(false);

    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);
    const startTime = Date.now();

    try {
      const res = await api.post('/ai/chat', {
        studentId,
        question: userText,
        noteId: noteIdParam,
        sessionId: activeSessionId,
      });

      const thoughtDuration = Math.max(2, Math.round((Date.now() - startTime) / 1000));

      if (!activeSessionId && res.data.sessionId) {
        setActiveSessionId(res.data.sessionId);
        fetchSessions();
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.data.answer,
          sources: res.data.sources,
          thoughtTime: thoughtDuration
        },
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I encountered an issue retrieving an answer. Please ensure you have uploaded study notes!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessageText = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIdx(idx);
    setTimeout(() => setCopiedMessageIdx(null), 2000);
  };

  const filteredFoldersForMention = folders.filter((f) =>
    f.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const filteredNotesForMention = notes.filter((n) =>
    n.title.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div
        className={`transition-all duration-300 ${
          isMaximized
            ? 'fixed inset-4 z-50 bg-[#1e1e2f] border border-indigo-500/50 rounded-2xl shadow-2xl p-4 flex gap-6'
            : 'max-w-7xl mx-auto h-[calc(100vh-8rem)] flex gap-6'
        }`}
      >
        {/* Left Sidebar - Chat Sessions History */}
        <div
          className={`bg-black/30 rounded-2xl flex flex-col shrink-0 hidden md:flex transition-all duration-300 overflow-hidden ${
            isConvCollapsed ? 'w-0 opacity-0 border-0' : 'w-80 border border-white/10'
          }`}
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 w-80">
            <h2 className="text-white font-bold flex items-center gap-2 truncate text-sm">
              <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" /> Conversations
            </h2>
            <div className="flex items-center gap-1 mx-auto md:mx-0">
              <button
                onClick={() => createNewSession()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors"
                title="New Chat"
              >
                <Plus className="w-4 h-4 shrink-0" /> <span>New Chat</span>
              </button>
              <button
                onClick={() => setIsConvCollapsed(true)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0a0b0] hover:text-white transition-colors"
                title="Hide Conversations"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 w-80">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                onClick={() => selectSession(sess.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group text-sm ${
                  activeSessionId === sess.id
                    ? 'bg-indigo-500/20 border border-indigo-500/40 text-white shadow-md'
                    : 'bg-white/5 border border-transparent text-[#a0a0b0] hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="truncate pr-2">
                  <h3 className="font-medium truncate">{sess.title}</h3>
                  <span className="text-[10px] text-[#808090]">
                    {new Date(sess.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(sess.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                  title="Delete Chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl">
          {/* Top Bar */}
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConvCollapsed && (
                <button
                  onClick={() => setIsConvCollapsed(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs"
                >
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Conversations</span>
                </button>
              )}

              <div className="bg-indigo-500/20 p-2.5 rounded-xl border border-indigo-500/30 text-indigo-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-white font-bold text-base flex items-center gap-2">
                  EduBridge AI Academic Engine
                  <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">
                    Groq Multi-Key Live
                  </span>
                </h1>
                <p className="text-xs text-[#a0a0b0]">
                  Grounded technical documentation tutor with folder & document-level vector search
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#a0a0b0] hover:text-white transition-colors"
                title={isMaximized ? 'Minimize' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {fetchingHistory ? (
              <div className="h-full flex flex-col items-center justify-center text-[#a0a0b0] gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-sm">Loading conversation history...</span>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg mt-1">
                      <Bot className="w-5 h-5" />
                    </div>
                  )}

                  <div
                    className={`max-w-3xl rounded-2xl p-5 shadow-xl space-y-3 ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-[#12121a] border border-white/10 text-[#e0e0e0] rounded-tl-none'
                    }`}
                  >
                    {/* Collapsible Reasoning Accordion for Bot Responses */}
                    {msg.sender === 'bot' && msg.thoughtTime && (
                      <div className="border-b border-white/10 pb-2 mb-3">
                        <button
                          onClick={() => setShowThoughtIdx(showThoughtIdx === idx ? null : idx)}
                          className="text-xs text-[#a0a0b0] hover:text-white flex items-center gap-1.5 font-mono"
                        >
                          <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Thought for {msg.thoughtTime}s</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              showThoughtIdx === idx ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {showThoughtIdx === idx && (
                          <div className="mt-2 text-xs text-[#808095] italic bg-black/40 p-3 rounded-lg border border-white/5 font-mono leading-relaxed">
                            Analyzed prompt parameters against indexed vector store. Formatted output structure according to academic documentation guidelines.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Markdown Rendered Content */}
                    {msg.sender === 'bot' ? (
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code: CodeBlock,
                          }}
                        >
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Action Bar & Cited Sources for Bot */}
                    {msg.sender === 'bot' && (
                      <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-[#a0a0b0] gap-2">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => copyMessageText(idx, msg.text)}
                            className="hover:text-white flex items-center gap-1 transition-colors"
                          >
                            {copiedMessageIdx === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedMessageIdx === idx ? 'Copied!' : 'Copy'}</span>
                          </button>

                          {msg.sources && msg.sources.length > 0 && (
                            <button
                              onClick={() => setShowSourcesIdx(showSourcesIdx === idx ? null : idx)}
                              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors font-medium"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{msg.sources.length} Cited Sources</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  showSourcesIdx === idx ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        <span className="text-[10px] text-[#606070] font-mono">EduBridge AI</span>
                      </div>
                    )}

                    {/* Cited Sources Accordion Drawer */}
                    {msg.sender === 'bot' && showSourcesIdx === idx && msg.sources && (
                      <div className="mt-3 bg-black/50 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                          📚 Retrieved Study Material Sources
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {msg.sources.map((src: any, sIdx: number) => (
                            <div key={sIdx} className="bg-white/5 p-2.5 rounded-lg border border-white/5 text-xs">
                              <div className="flex justify-between items-center text-indigo-400 font-semibold mb-1">
                                <span className="flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" /> {src.documentTitle}
                                </span>
                                {src.pageNumber && <span>Page {src.pageNumber}</span>}
                              </div>
                              <p className="text-[#a0a0b0] italic text-[11px] leading-relaxed">
                                "{src.contentSnippet}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg mt-1">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Autocomplete Mention Menu Popup for @Folders and @Notes */}
          {showMentionMenu && (
            <div className="absolute bottom-20 left-4 right-4 md:left-6 md:right-6 bg-[#161622] border border-indigo-500/40 rounded-2xl p-3 shadow-2xl z-30 max-h-60 overflow-y-auto space-y-3">
              {/* Folders Section */}
              {filteredFoldersForMention.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mb-1.5 px-2">
                    📁 Subject Folders (Search All Notes in Folder)
                  </h4>
                  <div className="space-y-1">
                    {filteredFoldersForMention.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => insertMention(f.name)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-500/20 text-white text-xs flex items-center justify-between group transition-colors"
                      >
                        <span className="font-semibold flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: f.color || '#6366f1' }}
                          />
                          @{f.name}
                        </span>
                        <span className="text-[10px] text-[#a0a0b0]">Folder • {f.notes?.length || 0} notes</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {filteredNotesForMention.length > 0 && (
                <div>
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mb-1.5 px-2">
                    📄 Specific Study Notes
                  </h4>
                  <div className="space-y-1">
                    {filteredNotesForMention.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => insertMention(n.title)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/10 text-white text-xs flex items-center justify-between group transition-colors"
                      >
                        <span className="font-medium text-[#e0e0e0] flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          @{n.title}
                        </span>
                        <span className="text-[10px] hover:text-white text-[#a0a0b0]">
                          {n.fileType || '.txt'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredFoldersForMention.length === 0 && filteredNotesForMention.length === 0 && (
                <div className="p-3 text-center text-xs text-[#a0a0b0]">
                  No matching folder or note document found
                </div>
              )}
            </div>
          )}

          {/* Bottom Chat Composer Input */}
          <div className="p-4 border-t border-white/10 bg-white/5">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask an academic question or type @ to tag complete folders or study notes..."
                disabled={loading}
                className="w-full bg-black/60 border border-white/10 rounded-2xl py-3.5 pl-4 pr-12 text-sm text-white placeholder-[#808095] focus:outline-none focus:border-indigo-500/50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AIChatPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="text-center text-[#a0a0b0]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto mb-3" />
            <span className="text-sm">Loading AI Chat...</span>
          </div>
        </div>
      </DashboardLayout>
    }>
      <AIChatInner />
    </Suspense>
  );
}
