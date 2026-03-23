import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

const SUGGESTED = ['Quantum Physics', 'Ancient Rome', 'Organic Chemistry', 'Linear Algebra', 'DNA & Genetics'];

const getFeedback = (score, total) => {
  const pct = score / total;
  if (pct === 1)   return { emoji: '🏆', msg: 'Perfect score! Outstanding!' };
  if (pct >= 0.8)  return { emoji: '🎉', msg: 'Excellent work!' };
  if (pct >= 0.6)  return { emoji: '👍', msg: 'Good job! Keep practising.' };
  if (pct >= 0.4)  return { emoji: '📚', msg: 'Not bad, but review the topic.' };
  return               { emoji: '💪', msg: "Keep studying — you'll get there!" };
};

/* ── Topic Input Screen ── */
function TopicInput({ onGenerate, loading, error }) {
  const [topic, setTopic] = useState('');

  return (
    <main className="ml-[240px] min-h-screen flex flex-col items-center justify-center p-8 bg-[#0d0d18] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"/>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"/>

      <div className="w-full max-w-2xl text-center space-y-12 relative z-10">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-[0px_0px_60px_rgba(189,157,255,0.15)] animate-pulse"
               style={{ background: 'linear-gradient(135deg, #bd9dff 0%, #8a4cfc 100%)' }}>
            <span className="material-symbols-outlined text-5xl text-[#000000]"
                  style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-6xl font-extrabold tracking-tighter text-on-surface leading-tight">Quiz yourself</h2>
          <p className="text-lg text-on-surface-variant font-medium tracking-wide">
            Enter any topic and get 5 AI-generated questions
          </p>
        </div>

        {error && (
          <p className="text-error text-sm bg-error-container/20 border border-error/30 rounded-xl px-4 py-3">{error}</p>
        )}

        <div className="space-y-6">
          <div className="relative group">
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && topic.trim() && onGenerate(topic)}
              placeholder="e.g. Photosynthesis, World War II, Algebra..."
              className="w-full border-none rounded-xl py-6 px-8 text-xl text-on-surface placeholder:text-outline/50 focus:ring-2 focus:ring-primary/40 focus:bg-surface-container-highest transition-all duration-500 shadow-2xl outline-none"
              style={{ background: 'rgba(30,30,45,0.4)', backdropFilter: 'blur(20px)' }}
            />
            <div className="absolute inset-0 rounded-xl border border-outline-variant/10 pointer-events-none group-focus-within:border-primary/20 transition-colors"/>
          </div>

          <div className="flex justify-center pt-4">
            <button
              onClick={() => topic.trim() && onGenerate(topic)}
              disabled={!topic.trim() || loading}
              className="font-bold py-5 px-12 rounded-xl text-lg flex items-center gap-3 hover:translate-y-[-4px] hover:shadow-[0px_20px_40px_rgba(189,157,255,0.2)] transition-all duration-500 active:scale-95 group disabled:opacity-40 text-[#000000]"
              style={{ background: 'linear-gradient(135deg, #bd9dff 0%, #8a4cfc 100%)' }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Generating...
                </>
              ) : (
                <>
                  Generate quiz
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="pt-8 flex flex-wrap justify-center gap-3">
          <span className="text-xs font-bold text-outline/60 uppercase tracking-widest block w-full mb-2">Suggested Topics</span>
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => onGenerate(s)}
                    className="bg-surface-container-high hover:bg-surface-bright text-on-surface-variant text-sm py-2 px-4 rounded-full border border-outline-variant/5 transition-colors">
              {s}
            </button>
          ))}
        </div>
      </div>

      <footer className="absolute bottom-10 text-on-tertiary-fixed-variant text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
        Powered by TutorAI Celestial Engine • 2024
      </footer>
    </main>
  );
}

/* ── Active Question Screen ── */
function ActiveQuestion({ question, options, topic, current, total, onAnswer }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (opt) => {
    if (selected) return;
    setSelected(opt);
  };

  const getStyle = (opt) => {
    if (!selected) return 'border-outline-variant/20 bg-surface-container hover:bg-surface-container-high group';
    if (opt === question.answer) return 'border-[#4ade80]/40 bg-[#4ade80]/5 shadow-[0_0_20px_rgba(74,222,128,0.05)]';
    if (opt === selected)        return 'border-error/40 bg-error/5';
    return 'border-outline-variant/20 bg-surface-container opacity-50';
  };

  return (
    <main className="ml-[240px] min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none"/>
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-secondary-container/5 blur-[150px] rounded-full pointer-events-none"/>

      <section className="max-w-4xl w-full mx-auto flex flex-col flex-1 px-12 py-16 z-10">
        {/* Progress */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Current Module</span>
            <h2 className="text-2xl font-bold text-on-surface tracking-tight">{topic}</h2>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex gap-2">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`h-1.5 w-10 rounded-full ${
                  i < current
                    ? 'bg-primary shadow-[0_0_10px_rgba(189,157,255,0.4)]'
                    : 'bg-outline-variant/30'
                }`}/>
              ))}
            </div>
            <span className="text-sm font-medium text-on-surface-variant">{current} / {total} questions</span>
          </div>
        </header>

        {/* Question Card */}
        <div className="rounded-[2rem] p-12 mb-8 relative border border-outline-variant/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-surface-container-low">
          <div className="absolute top-8 left-8">
            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-highest px-2 py-1 rounded tracking-widest uppercase">
              Question {current}
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-3xl font-bold text-on-surface leading-snug">{question.question}</h3>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-4 mb-10">
          {question.options.map((opt, i) => {
            const letter = ['A','B','C','D'][i];
            const isCorrect = selected && opt === question.answer;
            const isWrong   = selected === opt && opt !== question.answer;
            return (
              <button key={i} onClick={() => handleSelect(opt)}
                      className={`h-[52px] w-full flex items-center px-6 rounded-xl border-2 transition-all ${getStyle(opt)}`}>
                <span className={`w-8 font-bold text-sm ${isCorrect ? 'text-[#4ade80]' : isWrong ? 'text-error' : 'text-on-surface-variant group-hover:text-primary transition-colors'}`}>
                  {letter}
                </span>
                <span className={`font-medium flex-1 text-left ${selected && opt === question.answer ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>
                  {opt.replace(/^[A-D]\)\s*/, '')}
                </span>
                {isCorrect && <span className="material-symbols-outlined text-[#4ade80]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                {isWrong   && <span className="material-symbols-outlined text-error"      style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        {selected && (
          <footer className="flex items-center justify-between py-8">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selected === question.answer ? 'bg-[#4ade80]/10' : 'bg-error/10'}`}>
                <span className={`material-symbols-outlined ${selected === question.answer ? 'text-[#4ade80]' : 'text-error'}`}>
                  {selected === question.answer ? 'verified' : 'close'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className={`font-bold text-lg ${selected === question.answer ? 'text-[#4ade80]' : 'text-error'}`}>
                  {selected === question.answer ? 'Correct! ✓' : 'Incorrect'}
                </span>
                {selected !== question.answer && (
                  <span className="text-on-surface-variant text-xs">Correct: {question.answer}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => onAnswer(selected === question.answer)}
              className="group flex items-center gap-3 py-4 px-8 text-on-primary font-bold rounded-xl shadow-[0_10px_30px_rgba(189,157,255,0.2)] hover:shadow-[0_15px_40px_rgba(189,157,255,0.3)] transition-all active:scale-95"
              style={{ background: 'linear-gradient(90deg, #bd9dff, #8a4cfc)' }}
            >
              <span>{current >= total ? 'See results' : 'Next question'}</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </footer>
        )}
      </section>
    </main>
  );
}

/* ── Score Screen ── */
function ScoreScreen({ score, total, topic, answers, onRetry, onNew }) {
  const { emoji, msg } = getFeedback(score, total);
  const pct = Math.round((score / total) * 100);

  return (
    <main className="ml-[240px] min-h-screen flex items-center justify-center p-8 bg-[#0d0d18]">
      <div className="w-full max-w-2xl space-y-6">

        {/* Score card */}
        <div className="bg-surface-container-high rounded-2xl p-10 border border-outline-variant/10 text-center">
          <p className="text-5xl mb-4">{emoji}</p>
          <h2 className="text-5xl font-extrabold text-on-surface mb-1">{score}/{total}</h2>
          <p className="text-primary text-2xl font-bold mb-2">{pct}%</p>
          <p className="text-on-surface-variant">{msg}</p>
          <p className="text-on-surface-variant/60 text-sm mt-1">Topic: {topic}</p>
        </div>

        {/* Breakdown */}
        <div className="space-y-3">
          <h3 className="text-[0.6875rem] font-bold tracking-[0.2em] text-on-surface-variant/60 uppercase text-center mb-4">Review</h3>
          {answers.map((a, i) => (
            <div key={i} className={`p-5 rounded-xl border text-sm ${a.isCorrect ? 'border-[#4ade80]/20 bg-[#4ade80]/5' : 'border-error/20 bg-error/5'}`}>
              <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined mt-0.5 ${a.isCorrect ? 'text-[#4ade80]' : 'text-error'}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}>
                  {a.isCorrect ? 'check_circle' : 'cancel'}
                </span>
                <div>
                  <p className="text-on-surface font-medium mb-1">{i + 1}. {a.question}</p>
                  {!a.isCorrect && (
                    <p className="text-[#4ade80] text-xs">Correct answer: {a.correctAnswer}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-2">
          <button onClick={onRetry}
                  className="flex-1 py-4 rounded-xl font-bold text-on-primary transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #bd9dff, #8a4cfc)' }}>
            Retry same topic
          </button>
          <button onClick={onNew}
                  className="flex-1 py-4 rounded-xl font-bold border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-all">
            New topic
          </button>
        </div>
      </div>
    </main>
  );
}

/* ── Main Quiz Page ── */
export default function Quiz() {
  const { token } = useAuth();
  const [phase,     setPhase]     = useState('input');
  const [topic,     setTopic]     = useState('');
  const [questions, setQuestions] = useState([]);
  const [current,   setCurrent]   = useState(0);
  const [score,     setScore]     = useState(0);
  const [answers,   setAnswers]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const generateQuiz = async (topicVal) => {
    setLoading(true);
    setError('');
    setTopic(topicVal);
    try {
      const res  = await fetch('/api/quiz/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ topic: topicVal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate quiz');
      setQuestions(data.questions);
      setCurrent(0); setScore(0); setAnswers([]);
      setPhase('quiz');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (isCorrect) => {
    const q   = questions[current];
    const newScore   = isCorrect ? score + 1 : score;
    const newAnswers = [...answers, {
      question:      q.question,
      correctAnswer: q.answer,
      isCorrect,
    }];

    if (current + 1 >= questions.length) {
      setScore(newScore);
      setAnswers(newAnswers);
      setPhase('score');
      // Save result
      fetch('/api/quiz/save', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ topic, score: newScore, questions: newAnswers }),
      }).catch(() => {});
    } else {
      setScore(newScore);
      setAnswers(newAnswers);
      setCurrent(c => c + 1);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen font-['Plus_Jakarta_Sans']">
      <Sidebar />
      {phase === 'input' && <TopicInput onGenerate={generateQuiz} loading={loading} error={error} />}
      {phase === 'quiz'  && questions[current] && (
        <ActiveQuestion
          question={questions[current]}
          options={questions[current].options}
          topic={topic}
          current={current + 1}
          total={questions.length}
          onAnswer={handleAnswer}
        />
      )}
      {phase === 'score' && (
        <ScoreScreen
          score={score} total={questions.length}
          topic={topic} answers={answers}
          onRetry={() => generateQuiz(topic)}
          onNew={() => setPhase('input')}
        />
      )}
    </div>
  );
}
