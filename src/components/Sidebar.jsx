import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/chat', icon: 'chat',           label: 'AI Chat' },
  { path: '/quiz', icon: 'quiz',           label: 'Quiz' },
  { path: '/pdf',  icon: 'picture_as_pdf', label: 'PDF Generator' },
];

const RECENT = [
  { label: 'Mathematics basics', time: '2h ago' },
  { label: 'French Revolution',  time: 'Yesterday' },
  { label: 'Photosynthesis',     time: '3d ago' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PK';

  return (
    <aside className="h-screen w-[240px] fixed left-0 top-0 flex flex-col bg-[#12121e] border-r border-[#474754]/15 font-['Plus_Jakarta_Sans'] font-medium text-sm tracking-wide py-8 px-4 justify-between z-50">

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
            {RECENT.map(({ label, time }) => (
              <div key={label} className="group cursor-pointer">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/20" />
                  <span className="text-xs text-on-surface/80 group-hover:text-on-surface truncate transition-colors">{label}</span>
                </div>
                <span className="text-[10px] text-on-surface-variant/40 pl-3.5">{time}</span>
              </div>
            ))}
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
