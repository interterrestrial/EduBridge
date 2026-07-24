'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Plus, CheckCircle2, XCircle, Loader2, Award, AlertTriangle, FileText, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

export default function QuizzesPage() {
  const { user } = useAuth();
  const studentId = user?.id || 'student_1';

  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);

  // Active Quiz taking & evaluation state
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<any>(null);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/student/${studentId}`);
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
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
      fetchQuizzes();
      fetchNotes();
    }
  }, [studentId]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const targetNoteId = selectedNoteId === 'all' ? undefined : selectedNoteId;
      const targetNote = notes.find((n) => n.id === targetNoteId);

      const res = await api.post('/quizzes/generate', {
        studentId,
        noteId: targetNoteId,
        difficulty,
        count: Number(questionCount),
        title: targetNote ? `Quiz on ${targetNote.title}` : `Assessment (${difficulty.toUpperCase()})`,
      });

      setActiveQuiz(res.data);
      setAnswers({});
      setEvaluation(null);
      setShowModal(false);
      fetchQuizzes();
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      alert(err.response?.data?.error || 'Failed to generate quiz. Please ensure study notes are uploaded.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;

    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer,
      }));

      const res = await api.post('/quizzes/submit', {
        quizId: activeQuiz.id,
        studentId,
        answers: formattedAnswers,
      });

      setEvaluation(res.data);
    } catch (err: any) {
      console.error('Quiz submission error:', err);
      alert('Failed to submit quiz.');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">AI Quizzes</h1>
            <p className="text-[#a0a0a0]">Generate targeted practice assessments from specific uploaded notes.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Generate New Quiz
          </button>
        </div>

        {/* Generate Quiz Config Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-6 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Quiz Configuration
                </h2>
                <button onClick={() => setShowModal(false)} className="text-[#a0a0a0] hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Select Target Note Document</label>
                  <select
                    value={selectedNoteId}
                    onChange={(e) => setSelectedNoteId(e.target.value)}
                    className="w-full bg-input border border-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-colors"
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
                  <label className="block text-sm font-medium text-white mb-2">Difficulty Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setDifficulty(lvl)}
                        className={`py-2 rounded-xl text-xs uppercase font-bold border transition-colors cursor-pointer ${
                          difficulty === lvl
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-input border-border text-[#a0a0a0] hover:bg-white/10'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Number of Questions</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 5, 10].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setQuestionCount(cnt)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          questionCount === cnt
                            ? 'bg-primary/20 border-primary text-primary'
                            : 'bg-input border-border text-[#a0a0a0] hover:bg-white/10'
                        }`}
                      >
                        {cnt} Questions
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-[#a0a0a0] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {generating ? 'Generating Quiz...' : 'Generate Quiz'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Quiz Card */}
        {activeQuiz && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{activeQuiz.title}</h2>
                <p className="text-xs text-[#a0a0a0] uppercase mt-1">Difficulty: {activeQuiz.difficulty}</p>
              </div>
              <button
                onClick={() => {
                  setActiveQuiz(null);
                  setEvaluation(null);
                }}
                className="text-xs text-[#a0a0a0] hover:text-white cursor-pointer"
              >
                Close Quiz
              </button>
            </div>

            {evaluation ? (
              <div className="space-y-6">
                <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl text-center space-y-2">
                  <Award className="w-12 h-12 text-primary mx-auto" />
                  <h3 className="text-2xl font-bold text-white">Quiz Evaluation Complete!</h3>
                  <div className="text-4xl font-extrabold text-emerald-400">
                    {evaluation.score} / {evaluation.totalQuestions} ({evaluation.accuracy}%)
                  </div>
                </div>

                {evaluation.weakTopics && evaluation.weakTopics.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 text-amber-300">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                    <div>
                      <strong>Weak Topics Identified:</strong> {evaluation.weakTopics.join(', ')}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white">Detailed Step-by-Step Explanations:</h4>
                  {evaluation.evaluations.map((ev: any, idx: number) => (
                    <div key={idx} className="bg-input border border-border p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        {ev.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        Q{idx + 1}: {ev.questionText}
                      </div>
                      <div className="text-sm text-[#a0a0a0]">
                        Selected: <span className="text-white">{ev.selectedAnswer || 'None'}</span> | Correct:{' '}
                        <span className="text-emerald-400">{ev.correctAnswer}</span>
                      </div>
                      <div className="text-xs bg-background p-3 rounded text-primary/90">{ev.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {activeQuiz.questions.map((q: any, idx: number) => (
                  <div key={q.id || idx} className="bg-input border border-border p-5 rounded-xl space-y-4">
                    <h3 className="text-white font-semibold">
                      Q{idx + 1}: {q.question}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                        const optText = q[`option${optKey}`];
                        const isSelected = answers[q.id || `q_${idx}`] === optKey;

                        return (
                          <button
                            key={optKey}
                            onClick={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [q.id || `q_${idx}`]: optKey,
                              }))
                            }
                            className={`p-3 rounded-lg border text-left text-sm transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-primary/20 border-primary text-primary font-medium'
                                : 'bg-background border-border text-[#a0a0a0] hover:bg-white/10'
                            }`}
                          >
                            <strong>{optKey}:</strong> {optText}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleSubmitQuiz}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Submit & Evaluate Quiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* Quizzes List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border bg-input/50">
            <h2 className="text-xl font-bold text-white">Recent Quizzes</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-[#a0a0a0] flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading quizzes...
            </div>
          ) : quizzes.length === 0 ? (
            <div className="p-8 text-center text-[#a0a0a0]">
              No quizzes generated yet. Click <strong>Generate New Quiz</strong> above!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {quizzes.map((quiz, i) => (
                <div
                  key={quiz.id || i}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <div>
                    <h3 className="text-white font-bold text-lg">{quiz.title}</h3>
                    <p className="text-sm text-[#a0a0a0]">
                      {quiz.questions?.length || 5} Questions • Level: {quiz.difficulty}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveQuiz(quiz);
                      setAnswers({});
                      setEvaluation(null);
                    }}
                    className="bg-input hover:bg-primary hover:text-primary-foreground text-foreground px-4 py-2 rounded-xl transition-colors text-sm font-medium border border-border hover:border-primary cursor-pointer"
                  >
                    Take Quiz
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
