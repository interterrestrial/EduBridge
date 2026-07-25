'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  FileText,
  UploadCloud,
  Search,
  FolderPlus,
  Folder,
  FolderOpen,
  BrainCircuit,
  Loader2,
  CheckCircle2,
  Plus,
  X,
  ChevronRight,
  MoveRight,
  Wand2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

const FOLDER_COLORS = [
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Purple', value: '#a855f7' },
];

export default function NotesPage() {
  const { user } = useAuth();
  const studentId = user?.id || 'student_1';
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notes, setNotes] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // null = 'all'

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  // Folder creation modal state
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366f1');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [autoGrouping, setAutoGrouping] = useState(false);

  // Target folder for uploading note
  const [uploadFolderId, setUploadFolderId] = useState<string>('');

  const fetchNotesAndFolders = async () => {
    try {
      setLoading(true);
      const [notesRes, foldersRes] = await Promise.all([
        api.get(`/notes/student/${studentId}`),
        api.get(`/folders/notes/student/${studentId}`),
      ]);
      setNotes(notesRes.data.notes || []);
      setFolders(foldersRes.data.folders || []);
    } catch (err: any) {
      console.error('Error fetching study data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchNotesAndFolders();
    }
  }, [studentId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setCreatingFolder(true);
      await api.post('/folders/notes', {
        studentId,
        name: newFolderName.trim(),
        color: selectedColor,
      });

      setNewFolderName('');
      setShowFolderModal(false);
      fetchNotesAndFolders();
    } catch (err: any) {
      console.error('Failed to create folder:', err);
      alert(err.response?.data?.error || 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

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
      if (uploadFolderId) {
        formData.append('folderId', uploadFolderId);
      }

      await api.post('/notes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('Document indexed and assigned to folder successfully!');
      fetchNotesAndFolders();
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(err.response?.data?.error || 'Failed to upload document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleMoveNote = async (noteId: string, targetFolderId: string) => {
    try {
      await api.patch(`/folders/notes/${noteId}/move`, {
        folderId: targetFolderId === 'none' ? null : targetFolderId,
      });
      fetchNotesAndFolders();
    } catch (err) {
      console.error('Failed to move note:', err);
    }
  };

  const handleAutoGroup = async () => {
    try {
      setAutoGrouping(true);
      setMessage('AI is analyzing and organizing your uncategorized notes...');
      await api.post('/ai/auto-group', { studentId, type: 'notes' });
      setMessage('Notes successfully auto-grouped by AI!');
      fetchNotesAndFolders();
    } catch (err: any) {
      console.error('Auto-group failed:', err);
      alert(err.response?.data?.error || 'Failed to auto-group notes.');
    } finally {
      setAutoGrouping(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  // Filter notes by search & selected active folder tab
  const filteredNotes = notes.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFolderId === null) return true; // All
    if (activeFolderId === 'uncategorized') return !n.folderId;
    return n.folderId === activeFolderId;
  });

  const activeFolderObj = folders.find((f) => f.id === activeFolderId);

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

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              My Study Notes & Folders
            </h1>
            <p className="text-[#a0a0b0]">
              Organize study materials into subject folders, search FAISS embeddings, and chat with AI.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoGroup}
              disabled={autoGrouping || notes.filter((n) => !n.folderId).length === 0}
              className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 disabled:opacity-50 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 border border-indigo-500/20"
              title={notes.filter((n) => !n.folderId).length === 0 ? "No uncategorized notes to group" : "Auto-group uncategorized notes into existing folders"}
            >
              {autoGrouping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {autoGrouping ? 'Grouping...' : 'Magic Auto-Group'}
            </button>

            <button
              onClick={() => setShowFolderModal(true)}
              className="bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 border border-white/10"
            >
              <FolderPlus className="w-5 h-5 text-indigo-400" /> New Folder
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
              {uploading ? 'Indexing AI Embeddings...' : 'Upload Document'}
            </button>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {message}
          </div>
        )}

        {/* New Folder Modal */}
        {showFolderModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/90 border border-indigo-500/40 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-indigo-400" /> Create Subject Folder
                </h2>
                <button onClick={() => setShowFolderModal(false)} className="text-[#a0a0b0] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Folder Name</label>
                  <input
                    type="text"
                    required
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="e.g. Data Preprocessing & Analytics"
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white placeholder-[#a0a0b0] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Folder Color Theme</label>
                  <div className="grid grid-cols-6 gap-2">
                    {FOLDER_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setSelectedColor(c.value)}
                        style={{ backgroundColor: c.value }}
                        className={`h-9 rounded-xl transition-all ${
                          selectedColor === c.value
                            ? 'ring-4 ring-white/50 scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFolderModal(false)}
                    className="px-4 py-2 rounded-xl text-sm text-[#a0a0b0] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingFolder}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {creatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Folder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Folders Bar & Filter Pills */}
        <div className="space-y-3">
          <h2 className="text-xs uppercase font-bold tracking-wider text-[#a0a0b0]">Folders & Topics</h2>
          <div className="flex flex-wrap gap-3">
            {/* All Notes Tab */}
            <button
              onClick={() => setActiveFolderId(null)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
                activeFolderId === null
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200 shadow-md'
                  : 'bg-black/40 border-white/10 text-[#a0a0b0] hover:border-white/20 hover:text-white'
              }`}
            >
              <FolderOpen className="w-4 h-4 text-indigo-400" />
              All Notes ({notes.length})
            </button>

            {/* Custom Folders */}
            {folders.map((f) => {
              const count = notes.filter((n) => n.folderId === f.id).length;
              const isActive = activeFolderId === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFolderId(f.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2.5 border ${
                    isActive
                      ? 'bg-indigo-500/20 border-indigo-500/50 text-white shadow-md'
                      : 'bg-black/40 border-white/10 text-[#a0a0b0] hover:border-white/20 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: f.color || '#6366f1' }}
                  />
                  {f.name}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white">
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Uncategorized Tab */}
            <button
              onClick={() => setActiveFolderId('uncategorized')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
                activeFolderId === 'uncategorized'
                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200 shadow-md'
                  : 'bg-black/40 border-white/10 text-[#a0a0b0] hover:border-white/20 hover:text-white'
              }`}
            >
              <Folder className="w-4 h-4 text-slate-400" />
              Uncategorized ({notes.filter((n) => !n.folderId).length})
            </button>
          </div>
        </div>

        {/* Main Notes Container */}
        <div className="bg-black/20 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-[#a0a0b0] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes by keyword or topic..."
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white placeholder-[#a0a0b0] focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Target Folder selector for Uploads */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-[#a0a0b0] shrink-0">Upload into:</span>
              <select
                value={uploadFolderId}
                onChange={(e) => setUploadFolderId(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">📁 General (Uncategorized)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#a0a0b0] flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Loading notes and folders...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-xl">
              <FileText className="w-12 h-12 text-[#a0a0b0] mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-1">No notes in this view</h3>
              <p className="text-sm text-[#a0a0b0] mb-4">
                {activeFolderObj
                  ? `Upload a note into "${activeFolderObj.name}" or move an existing note here.`
                  : 'Upload a PDF, DOCX, or TXT file to start chatting with AI.'}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Upload Note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredNotes.map((note) => {
                const folderOfNote = folders.find((f) => f.id === note.folderId);
                return (
                  <div
                    key={note.id}
                    className="bg-black/40 border border-white/5 hover:border-white/20 rounded-xl p-5 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="bg-indigo-500/20 p-3 rounded-xl text-indigo-400">
                          <FileText className="w-6 h-6" />
                        </div>

                        {folderOfNote ? (
                          <span
                            className="text-xs font-semibold px-2.5 py-1 rounded-full text-white border border-white/10 flex items-center gap-1.5"
                            style={{ backgroundColor: `${folderOfNote.color}25` }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: folderOfNote.color }}
                            />
                            {folderOfNote.name}
                          </span>
                        ) : (
                          <span className="text-xs bg-white/5 text-[#a0a0b0] px-2.5 py-1 rounded-full border border-white/10">
                            Uncategorized
                          </span>
                        )}
                      </div>

                      <h3 className="text-white font-semibold text-lg leading-tight mb-2 line-clamp-2">
                        {note.title}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-[#a0a0b0] mb-4">
                        <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                        <span>FAISS Indexed</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-white/5">
                      {/* Move Folder Select */}
                      <div className="flex items-center justify-between text-xs text-[#a0a0b0]">
                        <span>Folder:</span>
                        <select
                          value={note.folderId || 'none'}
                          onChange={(e) => handleMoveNote(note.id, e.target.value)}
                          className="bg-black/60 border border-white/10 rounded-lg py-1 px-2 text-xs text-indigo-300 focus:outline-none"
                        >
                          <option value="none">No Folder</option>
                          {folders.map((f) => (
                            <option key={f.id} value={f.id}>
                              📁 {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => router.push(`/ai-chat?noteId=${note.id}`)}
                        className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 hover:text-indigo-200 text-indigo-300 border border-indigo-500/20 rounded-xl py-2 flex items-center justify-center gap-2 transition-colors text-sm font-medium"
                      >
                        <BrainCircuit className="w-4 h-4 text-indigo-400" /> Chat with AI
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
