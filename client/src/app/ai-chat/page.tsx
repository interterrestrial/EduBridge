'use client';

import { useState, useEffect, useRef } from 'react';
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
  FileText
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
      <code className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="my-4 rounded-xl border border-border overflow-hidden bg-card shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2 bg-input/50 border-b border-border text-xs text-[#a0a0a0]">
        <span className="font-mono uppercase font-semibold text-primary flex items-center gap-1.5">
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

export default function AIChatPage() {
  const { user } = useAuth();
  const studentId = user?.id || 'student_1';
  const searchParams = useSearchParams();
  const noteIdParam = searchParams.get('noteId') || undefined;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
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
      fetchNotes();
      fetchSessions();
    }
  }, [studentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/notes/student/${studentId}`);
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
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
            text: "Greetings! I am EduBridge Master AI, your academic and technical tutor. Ask me any theoretical, mathematical, or algorithmic question, or type `@` to tag a specific study note!",
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
          text: "New conversation started! Ask a question or use `@` to tag specific uploaded notes.",
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

  const insertMention = (noteTitle: string) => {
    const atIndex = input.lastIndexOf('@');
    const newText = input.slice(0, atIndex) + `@${noteTitle} `;
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

  const filteredNotesForMention = notes.filter((n) =>
    n.title.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div
        className={`transition-all duration-300 ${
          isMaximized
            ? 'fixed inset-4 z-50 bg-background border border-primary/50 rounded-2xl shadow-2xl p-4 flex gap-6'
            : 'max-w-7xl mx-auto h-[calc(100vh-8rem)] flex gap-6'
        }`}
      >
        {/* Left Sidebar - Chat Sessions History */}
        <div
          className={`bg-card/40 rounded-2xl flex flex-col shrink-0 hidden md:flex transition-all duration-300 overflow-hidden ${
            isConvCollapsed ? 'w-0 opacity-0 border-0' : 'w-80 border border-border'
          }`}
        >
          <div className="p-4 border-b border-border flex justify-between items-center bg-input/50 w-80">
            <h2 className="text-white font-bold flex items-center gap-2 truncate">
              <MessageSquare className="w-5 h-5 text-primary shrink-0" /> Conversations
            </h2>
            <div className="flex items-center gap-1 mx-auto md:mx-0">
              <button
                onClick={() => createNewSession()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="New Chat"
              >
                <Plus className="w-4 h-4 shrink-0" /> <span>New Chat</span>
              </button>
              <button
                onClick={() => setIsConvCollapsed(true)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#a0a0a0] hover:text-white transition-colors cursor-pointer"
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
                className={`p-3 rounded-xl cursor-pointer border transition-colors flex items-center justify-between group ${
                  activeSessionId === sess.id
                    ? 'bg-primary/20 border-primary/50 text-primary font-medium'
                    : 'bg-input border-border text-[#a0a0a0] hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="truncate pr-2 text-sm">{sess.title}</div>
                <button
                  onClick={(e) => handleDeleteSession(sess.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-[#a0a0a0] hover:text-red-400 p-1 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 bg-card/20 border border-border rounded-2xl flex flex-col overflow-hidden relative shadow-sm">
          {/* Header */}
          <div className="p-4 border-b border-border bg-input/50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {isConvCollapsed && (
                <button
                  onClick={() => setIsConvCollapsed(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#a0a0a0] hover:text-white transition-colors border border-border cursor-pointer"
                  title="Show Conversations"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  EduBridge Master AI <Sparkles className="w-4 h-4 text-primary" />
                </h1>
                <p className="text-xs text-[#a0a0a0]">
                  Universal LaTeX Math, Python Code & Algorithm Tutor. Type{' '}
                  <code className="bg-primary/20 text-primary px-1 py-0.5 rounded">@FileName</code> to target a note.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="bg-input hover:bg-white/10 text-white p-2 rounded-xl border border-border transition-colors cursor-pointer"
                title={isMaximized ? 'Compress View' : 'Maximise View'}
              >
                {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {fetchingHistory ? (
              <div className="text-center py-12 text-[#a0a0a0] flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading conversation messages...
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-4 max-w-[95%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
                      msg.sender === 'bot'
                        ? 'bg-gradient-to-tr from-primary to-primary/80 border-primary/30 text-primary-foreground'
                        : 'bg-gradient-to-tr from-purple-600 to-pink-600 border-purple-400/30 text-white'
                    }`}
                  >
                    {msg.sender === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    className={`p-6 text-sm leading-relaxed rounded-2xl shadow-xl transition-all ${
                      msg.sender === 'bot'
                        ? 'bg-card border border-border rounded-tl-sm text-[#e2e8f0] w-full'
                        : 'bg-primary/30 border border-primary/40 rounded-tr-sm text-white max-w-2xl'
                    }`}
                  >
                    {/* Collapsible Reasoning Process (Thought for X s >) for Bot Messages */}
                    {msg.sender === 'bot' && (
                      <div className="mb-4">
                        <button
                          onClick={() => setShowThoughtIdx(showThoughtIdx === idx ? null : idx)}
                          className="flex items-center gap-1.5 text-xs text-[#a0a0a0] hover:text-primary transition-colors py-1 px-2.5 rounded-lg bg-input/40 border border-border cursor-pointer"
                        >
                          <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                          <span>Thought for {msg.thoughtTime || 4}s</span>
                          {showThoughtIdx === idx ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>

                        {showThoughtIdx === idx && (
                          <div className="mt-2.5 p-3.5 rounded-xl bg-input/40 border border-border text-xs text-[#a0a0a0] space-y-1.5 font-mono leading-relaxed animate-fadeIn">
                            <p>• Analyzed uploaded study materials & query parameters.</p>
                            <p>• Constructed grounded RAG context & LaTeX mathematical formulation.</p>
                            <p>• Formatted output schema with clear markdown tables and syntax-highlighted code blocks.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Rich Rendered Content */}
                    <div className="prose prose-invert max-w-none text-sm leading-relaxed space-y-4">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          code: CodeBlock,
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto rounded-xl border border-border bg-input/30 shadow-lg">
                              <table className="w-full text-left border-collapse text-xs">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="bg-white/5 px-4 py-3 border-b border-border font-semibold text-primary uppercase tracking-wider">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-4 py-3 border-b border-border/50 text-[#cbd5e1]">
                              {children}
                            </td>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-lg font-bold text-white border-b border-border pb-2 mt-6 mb-3">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-base font-bold text-primary border-b border-border pb-1.5 mt-5 mb-2">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-semibold text-purple-300 mt-4 mb-2">
                              {children}
                            </h3>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-primary bg-primary/10 p-3.5 rounded-r-xl my-4 text-primary italic text-xs">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>

                    {/* Bottom Action Toolbar for Bot Messages */}
                    {msg.sender === 'bot' && (
                      <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs text-[#a0a0a0]">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => copyMessageText(idx, msg.text)}
                            className="flex items-center gap-1.5 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-border cursor-pointer"
                            title="Copy Response"
                          >
                            {copiedMessageIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedMessageIdx === idx ? 'Copied' : 'Copy'}</span>
                          </button>

                          {msg.sources && msg.sources.length > 0 && (
                            <button
                              onClick={() => setShowSourcesIdx(showSourcesIdx === idx ? null : idx)}
                              className="flex items-center gap-1.5 hover:text-primary transition-colors bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-lg border border-primary/20 cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-primary" />
                              <span>Sources ({msg.sources.length})</span>
                              {showSourcesIdx === idx ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expandable Grounded Sources Drawer */}
                    {msg.sender === 'bot' && showSourcesIdx === idx && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 p-3 bg-input/40 rounded-xl border border-primary/30 text-xs text-primary/80 space-y-2 animate-fadeIn">
                        <div className="font-semibold text-[#a0a0a0] flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-primary" /> Grounded Source Excerpts:
                        </div>
                        {msg.sources.map((src: any, sIdx: number) => (
                          <div key={sIdx} className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                            📄 <strong>{src.documentTitle}</strong> (Page {src.pageNumber || 1})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Glowing & Pulsing AI "Thinking & Reasoning..." State */}
            {loading && (
              <div className="flex items-start gap-4 max-w-[85%] animate-pulse">
                <div className="w-10 h-10 rounded-2xl bg-primary/30 border border-primary text-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
                  <BrainCircuit className="w-5 h-5 animate-spin" />
                </div>
                <div className="bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40 border border-primary/40 rounded-2xl rounded-tl-sm p-5 text-sm text-primary/80 flex items-center gap-3 shadow-xl w-full">
                  <Sparkles className="w-5 h-5 text-primary animate-bounce" />
                  <div>
                    <strong className="block text-white font-semibold">Thought for a few seconds...</strong>
                    <span className="text-xs text-[#a0a0a0]">Synthesizing step-by-step LaTeX math, code derivations, and grounded context</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Mention Auto-Complete Popover */}
          {showMentionMenu && filteredNotesForMention.length > 0 && (
            <div className="absolute bottom-20 left-6 right-6 bg-card border border-primary/40 rounded-xl p-2 shadow-2xl z-50 max-h-48 overflow-y-auto backdrop-blur-md">
              <div className="text-xs text-primary font-semibold px-3 py-1 border-b border-border flex items-center gap-1">
                <AtSign className="w-3.5 h-3.5" /> Tag document for targeted retrieval:
              </div>
              {filteredNotesForMention.map((n) => (
                <button
                  key={n.id}
                  onClick={() => insertMention(n.title)}
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-primary/30 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>📄 {n.title}</span>
                  <span className="text-xs text-[#a0a0a0] uppercase">{n.fileType}</span>
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <div className="p-4 border-t border-border bg-card/40 backdrop-blur-md">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask any question or type @NoteName to ground query..."
                disabled={loading}
                className="w-full bg-input border border-border rounded-2xl py-3 px-4 text-white placeholder-[#a0a0a0] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground p-3 rounded-xl transition-colors shadow-lg shadow-primary/20 shrink-0 cursor-pointer"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
