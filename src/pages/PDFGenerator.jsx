import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const GRADE_LEVELS = [
  'Secondary (Grades 6–10)',
  'Primary (Grades 1–5)',
  'Higher Education',
];

const ASSIGNMENT_TYPES = [
  { label: 'Worksheet',          icon: 'task_alt' },
  { label: 'Essay Assignment',   icon: 'article'  },
  { label: 'Problem Set',        icon: 'calculate'},
  { label: 'Comprehension Test', icon: 'quiz'     },
];

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

export default function PDFGenerator() {
  const { token } = useAuth();
  const [topic,   setTopic]   = useState('');
  const [grade,   setGrade]   = useState(GRADE_LEVELS[0]);
  const [type,    setType]    = useState('Worksheet');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');
  const [recentAssignments, setRecentAssignments] = useState([]);

  useEffect(() => {
    if (!token) return;

    apiFetch('/api/pdf/history', { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load assignment history');
        return res.json();
      })
      .then((data) => {
        setRecentAssignments(Array.isArray(data) ? data.slice(0, 3) : []);
      })
      .catch(() => {
        setRecentAssignments([]);
      });
  }, [token, success]);

  const generate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true); setSuccess(false); setError('');

    try {
      const res = await apiFetch('/api/pdf/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:    JSON.stringify({ topic, gradeLevel: grade, assignmentType: type }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `assignment-${topic.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen font-['Plus_Jakarta_Sans']">
      <Sidebar />

      <main className="ml-0 lg:ml-[240px] min-h-screen flex items-center justify-center p-4 sm:p-8 bg-surface relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"/>
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"/>

        {/* Top-right label */}
        <div className="absolute top-12 right-12 text-right hidden lg:block">
          <span className="block text-[0.6875rem] font-bold tracking-[0.2em] text-primary uppercase mb-1">Session Protocol</span>
          <div className="flex items-center gap-3 justify-end">
            <span className="text-on-surface-variant text-xs font-medium">Auto-formatting Active</span>
            <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_10px_#ff97b2]"/>
          </div>
        </div>

        <div className="relative w-full max-w-[480px] z-10 flex flex-col">

          {/* Form card */}
          <div className="bg-surface-container-high rounded-2xl p-8 border border-outline-variant/10 shadow-2xl hover:shadow-primary/5 transition-all duration-300">

            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mb-6 shadow-inner">
                <span className="material-symbols-outlined text-primary text-4xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-on-surface mb-2">PDF Generator</h2>
              <p className="text-on-surface-variant text-sm max-w-[280px]">
                Generate a formatted assignment on any topic
              </p>
            </div>

            <form className="space-y-6" onSubmit={generate}>

              {/* Topic */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-primary/70 ml-1">Topic</label>
                <input
                  type="text" value={topic} onChange={e => setTopic(e.target.value)} required
                  placeholder="e.g. Photosynthesis, French Revolution, Algebra..."
                  className="w-full bg-surface-container-highest border-none rounded-xl px-5 py-4 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:ring-1 focus:ring-primary/40 focus:bg-surface-bright transition-all outline-none"
                />
              </div>

              {/* Grade */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-primary/70 ml-1">Grade Level</label>
                <div className="relative">
                  <select
                    value={grade} onChange={e => setGrade(e.target.value)}
                    className="w-full appearance-none bg-surface-container-highest border-none rounded-xl px-5 py-4 text-sm text-on-surface focus:ring-1 focus:ring-primary/40 transition-all cursor-pointer outline-none"
                  >
                    {GRADE_LEVELS.map(g => <option key={g}>{g}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                    <span className="material-symbols-outlined text-lg">unfold_more</span>
                  </div>
                </div>
              </div>

              {/* Type */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-widest text-primary/70 ml-1">Assignment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {ASSIGNMENT_TYPES.map(({ label, icon }) => (
                    <button key={label} type="button" onClick={() => setType(label)}
                            className={`flex items-center justify-center gap-2 px-4 py-4 rounded-xl border text-xs font-semibold transition-all ${
                              type === label
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-outline-variant/20 bg-surface-container-highest text-on-surface-variant hover:border-outline-variant/50'
                            }`}>
                      <span className="material-symbols-outlined text-lg"
                            style={type === label ? { fontVariationSettings: "'FILL' 1" } : {}}>
                        {icon}
                      </span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              {error   && <p className="text-error text-sm bg-error-container/20 border border-error/30 rounded-xl px-4 py-3">{error}</p>}
              {success && <p className="text-[#4ade80] text-sm bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl px-4 py-3">PDF downloaded successfully!</p>}

              {/* Submit */}
              <div className="pt-2">
                <button type="submit" disabled={!topic.trim() || loading}
                        className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 text-white font-bold shadow-lg shadow-primary/10 transition-all ${
                          !topic.trim() || loading
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:opacity-90 active:scale-[0.98]'
                        }`}
                        style={{ background: 'linear-gradient(135deg, #bd9dff 0%, #8a4cfc 100%)' }}>
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
                      Generate &amp; Download PDF
                    </>
                  )}
                </button>
              </div>

              {/* Footnote */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="material-symbols-outlined text-sm text-on-surface-variant/60"
                      style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                <p className="text-[0.6875rem] text-on-surface-variant/60 leading-tight">
                  Uses AI to create a complete assignment with questions and an answer key
                </p>
              </div>
            </form>
          </div>

          {/* Recent Assignments */}
          <div className="mt-6">
            <h3 className="text-[0.6875rem] font-bold tracking-[0.2em] text-on-surface-variant/60 uppercase text-center mb-4">
              Recent Assignments
            </h3>
            <div className="space-y-2">
              {recentAssignments.length === 0 && (
                <div className="p-4 rounded-xl bg-surface-container-high/20 border border-outline-variant/10 text-center">
                  <p className="text-sm text-on-surface-variant">No assignments yet. Generate your first PDF assignment.</p>
                </div>
              )}

              {recentAssignments.map(({ _id, topic: assignmentTopic, assignmentType, generatedAt }) => (
                <div key={_id}
                     className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-high/40 border border-outline-variant/10 hover:bg-surface-container-high transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary/70 group-hover:text-primary transition-colors">picture_as_pdf</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-on-surface leading-tight">{assignmentTopic} - {assignmentType}</h4>
                    <p className="text-xs text-on-surface-variant">{formatRelativeTime(generatedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -right-12 -top-12 w-24 h-24 bg-tertiary/10 rounded-full blur-2xl animate-pulse pointer-events-none"/>
        </div>
      </main>
    </div>
  );
}
