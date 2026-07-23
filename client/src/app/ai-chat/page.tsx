'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Send, Bot, User, Loader2, BookOpen } from 'lucide-react';
import api from '../../lib/api';

const STUDENT_ID = 'student_1';

interface Message {
  id?: string;
  sender: 'bot' | 'user';
  text: string;
  sources?: any[];
}

export default function AIChatPage() {
  const searchParams = useSearchParams();
  const noteId = searchParams.get('noteId') || undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchHistory = async () => {
    try {
      setFetchingHistory(true);
      const res = await api.get(`/ai/history/${STUDENT_ID}`);
      const history = res.data.history || [];

      if (history.length === 0) {
        setMessages([
          {
            sender: 'bot',
            text: "Hello! I'm your EduBridge AI Tutor. Ask me any question based on your uploaded study notes!",
          },
        ]);
      } else {
        const formatted: Message[] = [];
        history.forEach((item: any) => {
          formatted.push({ sender: 'user', text: item.question });
          formatted.push({ sender: 'bot', text: item.answer, sources: item.sources });
        });
        setMessages(formatted);
      }
    } catch (err: any) {
      console.error('Error fetching chat history:', err);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');

    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        studentId: STUDENT_ID,
        question: userText,
        noteId,
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: res.data.answer,
          sources: res.data.sources,
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

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Tutor Chat</h1>
            <p className="text-[#a0a0b0]">
              {noteId ? 'Focusing on selected note' : 'Grounded answers strictly using your uploaded notes.'}
            </p>
          </div>
        </div>

        <div className="flex-1 bg-black/20 border border-white/10 rounded-2xl flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {fetchingHistory ? (
              <div className="text-center py-12 text-[#a0a0b0] flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Loading past chat history...
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-4 max-w-[85%] ${
                    msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                      msg.sender === 'bot'
                        ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
                        : 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                    }`}
                  >
                    {msg.sender === 'bot' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>

                  <div
                    className={`p-4 text-sm leading-relaxed rounded-2xl ${
                      msg.sender === 'bot'
                        ? 'bg-white/5 border border-white/10 rounded-tl-sm text-[#e0e0e0]'
                        : 'bg-indigo-500/20 border border-indigo-500/30 rounded-tr-sm text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 text-xs text-indigo-300 space-y-1">
                        <div className="font-semibold flex items-center gap-1 text-[#a0a0b0]">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Cited Sources:
                        </div>
                        {msg.sources.map((src: any, sIdx: number) => (
                          <div key={sIdx} className="bg-black/30 p-2 rounded border border-white/5">
                            📌 <strong>{src.documentTitle}</strong> (Page {src.pageNumber || 1})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-start gap-4 max-w-[80%]">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30 text-indigo-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 text-sm text-[#a0a0b0] flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Searching notes and generating response...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
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
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your study materials..."
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder-[#a0a0b0] focus:outline-none focus:border-indigo-500/50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white p-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 shrink-0"
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
