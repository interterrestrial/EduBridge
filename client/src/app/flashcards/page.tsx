'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Layers, Plus, Loader2, RefreshCw, FileText, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function FlashcardsPage() {
  const { user } = useAuth();
  const studentId = user?.id || 'student_1';

  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('all');
  const [cardCount, setCardCount] = useState<number>(5);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/flashcards/student/${studentId}`);
      setFlashcards(res.data.flashcards || []);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/notes/student/${studentId}`);
      setNotes(res.data.notes || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchFlashcards();
      fetchNotes();
    }
  }, [studentId]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const targetNoteId = selectedNoteId === 'all' ? undefined : selectedNoteId;

      await api.post('/flashcards/generate', {
        studentId,
        noteId: targetNoteId,
        count: Number(cardCount),
      });

      setShowModal(false);
      fetchFlashcards();
    } catch (err: any) {
      console.error('Flashcard generation error:', err);
      alert(err.response?.data?.error || 'Failed to generate flashcards. Make sure study notes are uploaded!');
    } finally {
      setGenerating(false);
    }
  };

  const toggleFlip = (id: string) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">AI Flashcards</h1>
            <p className="text-[#a0a0b0]">Master definitions, formulas, and concepts from specific study materials.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" /> Generate New Deck
          </button>
        </div>

        {/* Generate Flashcards Config Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-black/90 border border-indigo-500/40 rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" /> Flashcard Deck Configuration
                </h2>
                <button onClick={() => setShowModal(false)} className="text-[#a0a0b0] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Select Target Note Document</label>
                  <select
                    value={selectedNoteId}
                    onChange={(e) => setSelectedNoteId(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">📚 All Uploaded Notes (Comprehensive)</option>
                    {notes.map((n) => (
                      <option key={n.id} value={n.id}>
                        📄 {n.title} ({n.fileType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Number of Flashcards</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setCardCount(cnt)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                          cardCount === cnt
                            ? 'bg-indigo-500/30 border-indigo-500 text-white'
                            : 'bg-white/5 border-white/5 text-[#a0a0b0] hover:bg-white/10'
                        }`}
                      >
                        {cnt} Cards
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-[#a0a0b0] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {generating ? 'Extracting Cards...' : 'Generate Deck'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Flashcards Grid */}
        {loading ? (
          <div className="p-12 text-center text-[#a0a0b0] flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Loading flashcard deck...
          </div>
        ) : flashcards.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-black/20">
            <Layers className="w-12 h-12 text-orange-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-1">No Flashcard Decks</h3>
            <p className="text-sm text-[#a0a0b0] mb-4">Click below to extract active recall cards from your notes.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Generate First Deck
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashcards.map((card) => {
              const isFlipped = flipped[card.id];
              return (
                <div
                  key={card.id}
                  onClick={() => toggleFlip(card.id)}
                  className={`cursor-pointer min-h-[220px] rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between ${
                    isFlipped
                      ? 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/50 shadow-xl'
                      : 'bg-black/30 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs uppercase font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                        {card.topic || 'General'}
                      </span>
                      <RefreshCw className="w-4 h-4 text-[#a0a0b0]" />
                    </div>

                    <h3 className="text-white font-semibold text-base mb-2">
                      {isFlipped ? '💡 Answer:' : '❓ Concept Prompt:'}
                    </h3>
                    <p className={`text-sm leading-relaxed ${isFlipped ? 'text-indigo-200' : 'text-[#e0e0e0]'}`}>
                      {isFlipped ? card.answer : card.question}
                    </p>
                  </div>

                  <div className="text-xs text-[#a0a0b0] pt-4 border-t border-white/5 flex justify-between items-center">
                    <span>Type: {card.type || 'concept'}</span>
                    <span className="text-indigo-400 font-medium">{isFlipped ? 'Click to show question' : 'Click to flip card'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
