import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const TOPICS = ['Mathematics', 'Science', 'History', 'English', 'Coding', 'General'];

function TypingIndicator() {
  return (
    <div className="flex gap-6 items-start opacity-60">
      <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center shrink-0">
        <span className="text-primary font-bold text-xs">AI</span>
      </div>
      <div className="px-4 py-3 rounded-2xl flex gap-1 items-center"
           style={{ background: 'rgba(13,13,24,0.4)', backdropFilter: 'blur(20px)' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
               style={{ animationDelay: i === 0 ? '0s' : i === 1 ? '-0.15s' : '-0.3s' }}/>
        ))}
      </div>
    </div>
  );
}

function Message({ role, content, timestamp }) {
  const isUser = role === 'user';
  const time   = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isUser) return (
    <div className="flex gap-6 items-start justify-end">
      <div className="flex flex-col items-end gap-3 max-w-[85%]">
        <div className="bg-surface-container-high p-6 rounded-2xl rounded-tr-none border border-outline-variant/20 text-on-surface leading-relaxed shadow-sm">
          {content}
        </div>
        <span className="text-[0.6875rem] font-medium tracking-widest text-outline uppercase mr-1">
          You · {time}
        </span>
      </div>
      <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant/20">
        <span className="text-primary-fixed text-xs font-bold">PK</span>
      </div>
    </div>
  );

  return (
    <div className="flex gap-6 items-start">
      <div className="w-10 h-10 rounded-full bg-secondary-container/40 flex items-center justify-center shrink-0 border border-secondary/20 shadow-[0_0_15px_rgba(189,157,255,0.15)]">
        <span className="text-primary font-bold text-xs">AI</span>
      </div>
      <div className="flex flex-col gap-3 max-w-[85%]">
        <div className="p-6 rounded-2xl rounded-tl-none border border-outline-variant/10 text-on-surface-variant leading-relaxed"
             style={{ background: 'rgba(13,13,24,0.4)', backdropFilter: 'blur(20px)' }}
             dangerouslySetInnerHTML={{ __html: content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>') }}/>
        <span className="text-[0.6875rem] font-medium tracking-widest text-outline uppercase ml-1">
          TutorAI · {time}
        </span>
      </div>
    </div>
  );
}

export default function Chat() {
  const { token } = useAuth();
  const [messages,  setMessages]  = useState([{
    role: 'assistant', content: "Hello! I'm ready to help you learn. What topic would you like to explore today?", timestamp: new Date()
  }]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [topic,     setTopic]     = useState('Mathematics');
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ message: userMsg.content, topic, sessionId }),
      });
      const data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen overflow-hidden font-['Plus_Jakarta_Sans']">
      <Sidebar />

      {/* Left sidebar handled by Sidebar component — right context panel */}
      <main className="ml-[240px] mr-[280px] h-screen flex flex-col bg-surface-container-low relative">

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#0d0d18]/40 backdrop-blur-xl z-40 border-b border-outline-variant/10">
          <div className="flex items-center gap-2">
            <select
              value={topic}
              onChange={e => { setTopic(e.target.value); setMessages([]); setSessionId(null); }}
              className="bg-transparent text-sm font-medium tracking-widest uppercase text-on-surface focus:outline-none cursor-pointer"
            >
              {TOPICS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-1.5 text-xs font-semibold text-secondary border border-outline-variant/30 rounded-lg hover:bg-surface-container-high transition-colors">
              Focus Mode
            </button>
            <button onClick={() => { setMessages([]); setSessionId(null); }}
                    className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">
              add_comment
            </button>
          </div>
        </header>

        {/* Messages */}
        <section className="flex-1 overflow-y-auto px-8 py-12 flex flex-col gap-12 max-w-4xl mx-auto w-full"
                 style={{ scrollbarWidth: 'thin', scrollbarColor: '#474754 transparent' }}>
          {messages.map((msg, i) => <Message key={i} {...msg} />)}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </section>

        {/* Input */}
        <footer className="p-8 pt-0 bg-gradient-to-t from-surface-container-low via-surface-container-low to-transparent">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"/>
            <div className="relative bg-surface-container-high rounded-xl border border-outline-variant/20 p-4 shadow-xl focus-within:border-primary/40 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask about ${topic}...`}
                rows={2}
                className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline resize-none outline-none"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-[0.6875rem] text-on-surface-variant tracking-wide px-1 uppercase font-semibold">
                  Enter to send · Shift+Enter for new line
                </span>
                <div className="flex gap-2">
                  <button className="p-2 hover:bg-surface-bright rounded-lg transition-colors text-on-surface-variant">
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="bg-gradient-to-br from-primary to-primary-dim p-2 rounded-lg text-on-primary-container shadow-lg hover:shadow-primary/20 active:scale-95 transition-all disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Right context panel */}
      <aside className="w-[280px] h-full fixed right-0 top-0 bg-surface flex flex-col z-30 border-l border-outline-variant/10">
        <div className="h-16 flex items-center px-6 border-b border-outline-variant/10">
          <span className="text-xs font-bold tracking-widest uppercase text-primary">Context &amp; Resources</span>
        </div>
        <div className="p-6 flex flex-col gap-8">
          <div className="bg-surface-container-high/40 rounded-xl p-5 border border-outline-variant/20">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[0.6875rem] font-bold tracking-widest uppercase text-tertiary">Current Topic</span>
            </div>
            <h3 className="font-semibold text-on-surface mb-2">{topic}</h3>
            <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-tertiary to-primary w-2/3 h-full"/>
            </div>
            <span className="text-[0.6875rem] text-on-surface-variant mt-2 block">
              {messages.filter(m => m.role === 'user').length} questions asked
            </span>
          </div>

          <div className="mt-4 p-5 rounded-xl border border-primary/20 bg-primary/5 relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-full blur-xl group-hover:bg-primary/20 transition-all"/>
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-sm">lightbulb</span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">AI Insight</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Ask follow-up questions for deeper understanding. Try "Can you give me an example?" or "Explain it differently."
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
