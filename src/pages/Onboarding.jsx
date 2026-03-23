import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: 'chat_bubble',   color: 'text-primary',   title: 'AI Chat Assistant', desc: 'Get instant answers to your study questions.' },
  { icon: 'quiz',          color: 'text-secondary',  title: 'Dynamic Quizzes',   desc: 'Generate tailored assessments in seconds.' },
  { icon: 'picture_as_pdf',color: 'text-tertiary',   title: 'PDF Generator',     desc: 'Create study notes and summaries automatically.' },
];

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="bg-surface text-on-surface min-h-screen overflow-x-hidden font-['Plus_Jakarta_Sans']">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#0d0d18]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(189,157,255,0.08)]">
        <div className="flex justify-between items-center h-20 px-8 max-w-[1440px] mx-auto">
          <span className="text-xl font-bold tracking-tighter text-primary">TutorAI</span>
          <div className="hidden md:flex items-center space-x-10">
            {['Features', 'About', 'Pricing'].map((item, i) => (
              <a key={item} href="#"
                className={`text-sm tracking-tight font-semibold transition-all duration-200 ${i === 0 ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
                {item}
              </a>
            ))}
          </div>
          <button
            onClick={() => navigate('/signin')}
            className="bg-primary hover:bg-primary-dim text-on-primary font-semibold py-2.5 px-6 rounded transition-all duration-200 active:scale-95"
          >
            Log in
          </button>
        </div>
      </nav>

      <main className="relative pt-20">
        {/* Hero */}
        <section className="relative min-h-[921px] flex items-center px-8 md:px-16 lg:px-24 max-w-[1440px] mx-auto overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-16 w-full items-center">

            {/* Left */}
            <div className="lg:col-span-6 flex flex-col items-start z-10">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-primary-dim/40 bg-primary/5 mb-8">
                <span className="text-xs font-bold tracking-widest uppercase text-primary">AI-powered learning</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8">
                Your personal <br />
                <span className="bg-gradient-to-r from-primary to-primary-dim bg-clip-text text-transparent">AI Tutor</span>
              </h1>
              <p className="text-lg md:text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
                Ask questions, take quizzes, generate assignments — powered by cutting-edge AI and built for real learning.
              </p>
              <div className="flex flex-wrap gap-3 mb-12">
                {['AI Chat', 'Smart Quizzes', 'PDF Assignments', 'RAG-Powered'].map(tag => (
                  <span key={tag} className="px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant/20 text-secondary text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-5">
                <button
                  onClick={() => navigate('/signup')}
                  className="px-8 py-4 bg-gradient-to-br from-primary to-primary-dim text-on-primary font-bold rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                >
                  Start learning free
                </button>
                <button
                  onClick={() => navigate('/signin')}
                  className="px-8 py-4 bg-transparent border border-outline-variant text-secondary font-bold rounded-lg hover:bg-secondary/10 transition-all"
                >
                  Sign in
                </button>
              </div>
            </div>

            {/* Right — Orb */}
            <div className="lg:col-span-4 relative flex justify-center items-center h-[500px] lg:h-full">
              <div className="absolute w-[150%] h-[150%] pointer-events-none"
                   style={{ background: 'radial-gradient(circle at 50% 50%, rgba(189,157,255,0.15) 0%, transparent 70%)' }} />
              <div className="relative w-full aspect-square max-w-[400px]">
                <div className="absolute inset-0" style={{ filter: 'drop-shadow(0 0 60px rgba(189,157,255,0.4))' }}>
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary-dim/80 via-primary/40 to-tertiary/20 blur-xl animate-pulse" />
                </div>
                {/* SVG Brain illustration (replaces the Google-hosted image) */}
                <svg className="relative z-10 w-full h-full opacity-90" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="orbGrad" cx="50%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#bd9dff" stopOpacity="0.9"/>
                      <stop offset="60%" stopColor="#8a4cfc" stopOpacity="0.6"/>
                      <stop offset="100%" stopColor="#ff97b2" stopOpacity="0.2"/>
                    </radialGradient>
                  </defs>
                  <circle cx="100" cy="100" r="90" fill="url(#orbGrad)" opacity="0.3"/>
                  <path d="M100,30 C60,30 35,55 35,90 C35,120 55,145 80,155 L100,175 L120,155 C145,145 165,120 165,90 C165,55 140,30 100,30 Z"
                        fill="none" stroke="#bd9dff" strokeDasharray="4 2" strokeWidth="0.8"/>
                  <path d="M70,60 Q100,40 130,60" fill="none" stroke="#bd9dff" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M60,90 Q100,70 140,90" fill="none" stroke="#a88cfb" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M70,120 Q100,100 130,120" fill="none" stroke="#bd9dff" strokeLinecap="round" strokeWidth="2"/>
                  <path d="M100,60 V130" fill="none" stroke="#bd9dff" strokeLinecap="round" strokeWidth="1.5"/>
                  {[{cx:70,cy:60},{cx:130,cy:60},{cx:70,cy:120},{cx:130,cy:120}].map((p,i)=>(
                    <circle key={i} cx={p.cx} cy={p.cy} r="4" fill="#bd9dff"/>
                  ))}
                  {[{cx:60,cy:90},{cx:140,cy:90}].map((p,i)=>(
                    <circle key={i} cx={p.cx} cy={p.cy} r="4" fill="#a88cfb"/>
                  ))}
                  <circle cx="100" cy="45" r="3" fill="#ff97b2"/>
                  <circle cx="100" cy="140" r="3" fill="#ff97b2"/>
                </svg>
                {/* Floating particles */}
                <div className="absolute top-1/4 -left-4 w-2 h-2 rounded-full bg-primary animate-bounce opacity-60"/>
                <div className="absolute top-3/4 left-10 w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse opacity-40"/>
                <div className="absolute top-1/2 -right-8 w-2.5 h-2.5 rounded-full bg-secondary-fixed animate-ping opacity-30"/>
                <div className="absolute bottom-1/4 right-1/4 w-1 h-1 rounded-full bg-white animate-pulse opacity-80"/>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-28 px-8 md:px-16 lg:px-24 bg-surface-container-low">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {FEATURES.map(({ icon, color, title, desc }) => (
                <div key={title} className="group p-10 rounded-xl bg-surface-container-high transition-all duration-300 hover:-translate-y-2 hover:bg-surface-bright relative overflow-hidden">
                  <div className="mb-8 relative inline-block">
                    <div className="absolute inset-0 bg-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"/>
                    <span className={`material-symbols-outlined text-4xl ${color} relative z-10`}>{icon}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-on-surface">{title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-8 text-center bg-surface-container-lowest">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold tracking-tight">Ready to elevate your learning?</h2>
            <p className="text-on-surface-variant italic">The future of education is here, personalised just for you.</p>
            <div className="pt-6">
              <button
                onClick={() => navigate('/signup')}
                className="px-10 py-4 bg-primary text-on-primary font-bold rounded-lg hover:scale-105 transition-transform"
              >
                Create Account
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-outline-variant/10 px-8 bg-surface text-center">
        <p className="text-sm text-on-surface-variant">© 2024 TutorAI. All intellectual assets protected.</p>
      </footer>
    </div>
  );
}
