import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

function formatRelativeTime(dateInput) {
  const date = new Date(dateInput);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 2 * day) return 'Yesterday';
  return `${Math.floor(diffMs / day)}d ago`;
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/50 p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-base">{icon}</span>
        <span className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant">{label}</span>
      </div>
      <p className="text-2xl font-bold text-on-surface">{value}</p>
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [quizHistory, setQuizHistory] = useState([]);
  const [pdfHistory, setPdfHistory] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const [quizRes, pdfRes, chatRes] = await Promise.all([
          apiFetch('/api/quiz/history', { credentials: 'include' }),
          apiFetch('/api/pdf/history', { credentials: 'include' }),
          apiFetch('/api/chat/history', { credentials: 'include' }),
        ]);

        const [quizData, pdfData, chatData] = await Promise.all([
          quizRes.ok ? quizRes.json() : Promise.resolve([]),
          pdfRes.ok ? pdfRes.json() : Promise.resolve([]),
          chatRes.ok ? chatRes.json() : Promise.resolve([]),
        ]);

        if (!mounted) return;
        setQuizHistory(Array.isArray(quizData) ? quizData : []);
        setPdfHistory(Array.isArray(pdfData) ? pdfData : []);
        setChatHistory(Array.isArray(chatData) ? chatData : []);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const avgScorePct = useMemo(() => {
    if (quizHistory.length === 0) return 0;
    const totalPct = quizHistory.reduce((acc, item) => {
      const total = item.total || 5;
      return acc + ((item.score || 0) / total) * 100;
    }, 0);
    return Math.round(totalPct / quizHistory.length);
  }, [quizHistory]);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-['Plus_Jakarta_Sans']">
      <Sidebar />

      <main className="ml-0 lg:ml-[240px] p-4 sm:p-8">
        <header className="mb-8 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
            <p className="mt-2 text-on-surface-variant">
              Activity snapshot for chat sessions, quizzes, and generated assignments.
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high/60 px-4 py-3 text-right">
            <p className="text-sm font-semibold text-on-surface">{user?.name || 'Student'}</p>
            <p className="text-xs text-on-surface-variant">{user?.email || ''}</p>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Chat Sessions" value={chatHistory.length} icon="forum" />
          <StatCard label="Quizzes Taken" value={quizHistory.length} icon="quiz" />
          <StatCard label="Average Quiz Score" value={`${avgScorePct}%`} icon="bar_chart" />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-high/40 p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">Recent Chats</h2>
            <div className="space-y-3">
              {loading && <p className="text-sm text-on-surface-variant">Loading...</p>}
              {!loading && chatHistory.slice(0, 6).map((chat) => (
                <div key={chat._id} className="rounded-lg border border-outline-variant/10 bg-surface-container-high/40 px-3 py-2">
                  <p className="text-sm font-semibold text-on-surface">{chat.topic}</p>
                  <p className="text-xs text-on-surface-variant">{formatRelativeTime(chat.createdAt)}</p>
                </div>
              ))}
              {!loading && chatHistory.length === 0 && <p className="text-sm text-on-surface-variant">No chat sessions yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-high/40 p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">Recent Quizzes</h2>
            <div className="space-y-3">
              {loading && <p className="text-sm text-on-surface-variant">Loading...</p>}
              {!loading && quizHistory.slice(0, 6).map((quiz, idx) => (
                <div key={`${quiz.topic}-${idx}`} className="rounded-lg border border-outline-variant/10 bg-surface-container-high/40 px-3 py-2">
                  <p className="text-sm font-semibold text-on-surface">{quiz.topic}</p>
                  <p className="text-xs text-on-surface-variant">
                    Score: {quiz.score}/{quiz.total} · {formatRelativeTime(quiz.takenAt)}
                  </p>
                </div>
              ))}
              {!loading && quizHistory.length === 0 && <p className="text-sm text-on-surface-variant">No quizzes taken yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-high/40 p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">Recent PDFs</h2>
            <div className="space-y-3">
              {loading && <p className="text-sm text-on-surface-variant">Loading...</p>}
              {!loading && pdfHistory.slice(0, 6).map((pdf) => (
                <div key={pdf._id} className="rounded-lg border border-outline-variant/10 bg-surface-container-high/40 px-3 py-2">
                  <p className="text-sm font-semibold text-on-surface">{pdf.topic}</p>
                  <p className="text-xs text-on-surface-variant">
                    {pdf.assignmentType} · {formatRelativeTime(pdf.generatedAt)}
                  </p>
                </div>
              ))}
              {!loading && pdfHistory.length === 0 && <p className="text-sm text-on-surface-variant">No PDF assignments yet.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
