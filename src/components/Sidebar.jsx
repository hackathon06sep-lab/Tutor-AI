import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const NAV_ITEMS = [
  { path: '/chat', icon: 'chat',           label: 'AI Chat' },
  { path: '/quiz', icon: 'quiz',           label: 'Quiz' },
  { path: '/pdf',  icon: 'picture_as_pdf', label: 'PDF Generator' },
  { path: '/profile', icon: 'account_circle', label: 'Profile' },
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

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [recentChats, setRecentChats] = useState([]);

  useEffect(() => {
    if (!token) {
      setRecentChats([]);
      return;
    }

    apiFetch('/api/chat/history', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : []))
      .then(data => setRecentChats(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => setRecentChats([]));
  }, [token]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PK';

  return (
    <aside className="hidden lg:flex h-screen w-[240px] fixed left-0 top-0 flex-col bg-[#12121e] border-r border-[#474754]/15 font-['Plus_Jakarta_Sans'] font-medium text-sm tracking-wide py-8 px-4 justify-between z-50">

      <div className="flex flex-col gap-6">
        {/* Logo */}
        <div className="px-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-[#ece9fb] tracking-tight">TutorAI</span>
              <span className="text-[10px] text-on-surface-variant/50 uppercase tracking-[0.1em]">Midnight Scholar</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.15em]">Menu</span>
          </div>
          {NAV_ITEMS.map(({ path, icon, label }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? 'bg-[#ae8dff]/10 text-[#ba9eff] border-r-2 border-[#ba9eff]'
                    : 'text-[#aba9ba]/70 hover:bg-[#2a2a3d]/40 hover:text-[#ece9fb]'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Recent */}
        <div className="flex flex-col gap-1 mt-2">
          <div className="px-3 mb-2">
            <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-[0.15em]">Recent</span>
          </div>
          <div className="px-3 space-y-3">
            {recentChats.map(({ topic, createdAt, _id }) => (
              <button
                key={_id}
                type="button"
                onClick={() => navigate(`/chat?topic=${encodeURIComponent(topic)}&sessionId=${_id}`)}
                className="group cursor-pointer text-left w-full"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/20" />
                  <span className="text-xs text-on-surface/80 group-hover:text-on-surface truncate transition-colors">{topic}</span>
                </div>
                <span className="text-[10px] text-on-surface-variant/40 pl-3.5">{formatRelativeTime(createdAt)}</span>
              </button>
            ))}
            {recentChats.length === 0 && (
              <p className="text-[10px] text-on-surface-variant/40 pl-3.5">No recent chats yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-4 border-t border-[#474754]/10 pt-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-xs font-bold text-on-secondary-container ring-2 ring-primary/10">
            {initials}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-on-surface truncate">{user?.name || 'Piyush Kumar'}</span>
            <span className="text-[10px] text-on-surface-variant/60 truncate">{user?.email || ''}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 text-[#aba9ba]/70 hover:text-error hover:bg-error/5 transition-all duration-300 rounded-lg group"
        >
          <span className="material-symbols-outlined text-[#aba9ba]/50 group-hover:text-error transition-colors">logout</span>
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
