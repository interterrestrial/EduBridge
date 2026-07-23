'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Plus, CheckCircle2, XCircle, Loader2, Award, AlertTriangle } from 'lucide-react';
import api from '../../lib/api';

const STUDENT_ID = 'student_1';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<any>(null);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quizzes/student/${STUDENT_ID}`);
      setQuizzes(res.data.quizzes || []);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/quizzes/generate', {
        studentId: STUDENT_ID,
        difficulty: 'medium',
        count: 3,
        title: 'Adaptive Practice Assessment',
      });

      setActiveQuiz(res.data);
      setAnswers({});
      setEvaluation(null);
      fetchQuizzes();
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      alert(err.response?.data?.error || 'Failed to generate quiz. Please ensure notes are uploaded.');
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
        studentId: STUDENT_ID,
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
            <h1 className="text-3xl font-bold text-white">AI Quizzes</h1>
            <p className="text-[#a0a0b0]">Test your knowledge and evaluate concept mastery.</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            {generating ? 'Generating Questions with Gemini...' : 'Generate New Quiz'}
          </button>
        </div>

        {activeQuiz && (
          <div className="bg-black/40 border border-indigo-500/30 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{activeQuiz.title}</h2>
                <p className="text-xs text-[#a0a0b0] uppercase mt-1">Difficulty: {activeQuiz.difficulty}</p>
              </div>
              <button
                onClick={() => {
                  setActiveQuiz(null);
                  setEvaluation(null);
                }}
                className="text-xs text-[#a0a0b0] hover:text-white"
              >
                Close Quiz
              </button>
            </div>

            {evaluation ? (
              <div className="space-y-6">
                <div className="bg-indigo-500/20 border border-indigo-500/30 p-6 rounded-xl text-center space-y-2">
                  <Award className="w-12 h-12 text-indigo-400 mx-auto" />
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
                  <h4 className="text-lg font-bold text-white">Detailed Explanations:</h4>
                  {evaluation.evaluations.map((ev: any, idx: number) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 font-bold text-white">
                        {ev.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        Q{idx + 1}: {ev.questionText}
                      </div>
                      <div className="text-sm text-[#a0a0b0]">
                        Selected: <span className="text-white">{ev.selectedAnswer || 'None'}</span> | Correct:{' '}
                        <span className="text-emerald-400">{ev.correctAnswer}</span>
                      </div>
                      <div className="text-xs bg-black/40 p-3 rounded text-indigo-200">{ev.explanation}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {activeQuiz.questions.map((q: any, idx: number) => (
                  <div key={q.id || idx} className="bg-white/5 border border-white/10 p-5 rounded-xl space-y-4">
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
                            className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                              isSelected
                                ? 'bg-indigo-500/30 border-indigo-500 text-white font-medium'
                                : 'bg-black/30 border-white/5 text-[#a0a0b0] hover:bg-white/10'
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
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Submit & Evaluate Quiz
                </button>
              </div>
            )}
          </div>
        )}

        <div className="bg-black/20 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-white/5">
            <h2 className="text-xl font-bold text-white">Recent Quizzes</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-[#a0a0b0] flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Loading quizzes...
            </div>
          ) : quizzes.length === 0 ? (
            <div className="p-8 text-center text-[#a0a0b0]">
              No quizzes generated yet. Click <strong>Generate New Quiz</strong> above!
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {quizzes.map((quiz, i) => (
                <div
                  key={quiz.id || i}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                >
                  <div>
                    <h3 className="text-white font-bold text-lg">{quiz.title}</h3>
                    <p className="text-sm text-[#a0a0b0]">
                      {quiz.questions?.length || 3} Questions • Level: {quiz.difficulty}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveQuiz(quiz);
                      setAnswers({});
                      setEvaluation(null);
                    }}
                    className="bg-white/5 hover:bg-indigo-500 hover:text-white text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium border border-white/10"
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
