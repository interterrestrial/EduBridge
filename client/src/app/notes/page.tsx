'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FileText, UploadCloud, Search, Filter, MoreVertical, BrainCircuit, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function NotesPage() {
  const { user } = useAuth();
  const studentId = user?.id || 'student_1';
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/notes/student/${studentId}`);
      setNotes(res.data.notes || []);
    } catch (err: any) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchNotes();
    }
  }, [studentId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setMessage('Uploading and indexing document with Gemini vector store...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentId', studentId);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

      await api.post('/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('Document indexed successfully!');
      fetchNotes();
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(err.response?.data?.error || 'Failed to upload document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.txt"
          className="hidden"
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">My Notes</h1>
            <p className="text-[#a0a0a0]">Upload, organize, and chat with your study materials.</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {uploading ? 'Processing AI Embeddings...' : 'Upload Document'}
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {message}
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-[#a0a0a0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full bg-input border border-border rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-[#a0a0a0] focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#a0a0a0] flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading your indexed notes...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-xl bg-input/20">
              <FileText className="w-12 h-12 text-[#a0a0a0] mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-1">No study notes found</h3>
              <p className="text-sm text-[#a0a0a0] mb-4">Upload a PDF, DOCX, or TXT file to start chatting with AI.</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
              >
                Upload First Note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <div key={note.id} className="bg-input border border-border hover:border-primary/40 rounded-xl p-5 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-primary/20 p-3 rounded-lg text-primary">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-xs uppercase bg-white/5 border border-border px-2 py-1 rounded text-[#a0a0a0]">
                        {note.fileType || '.txt'}
                      </span>
                    </div>
                    <h3 className="text-white font-medium text-lg leading-tight mb-2 line-clamp-2">{note.title}</h3>
                    <div className="flex items-center justify-between text-xs text-[#a0a0a0] mb-4">
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                      <span>FAISS Vector Indexed</span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/ai-chat?noteId=${note.id}`)}
                    className="w-full bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary border border-primary/20 rounded-lg py-2 flex items-center justify-center gap-2 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <BrainCircuit className="w-4 h-4" /> Chat with AI
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
