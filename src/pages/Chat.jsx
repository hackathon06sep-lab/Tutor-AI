import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { apiFetch, apiUrl } from '../utils/api';

const TOPICS = ['Mathematics', 'Science', 'History', 'English', 'Coding', 'General'];
const INITIAL_ASSISTANT_MESSAGE = "Hello! I'm ready to help you learn. What topic would you like to explore today?";
const CHAT_MESSAGES_KEY = 'tutor_chat_messages';
const CHAT_SESSION_KEY = 'tutor_chat_session';
const CHAT_TOPIC_KEY = 'tutor_chat_topic';
const STREAM_IDLE_TIMEOUT_MS = 12000;
const STREAM_TOTAL_TIMEOUT_MS = 45000;

function getSavedMessages() {
  try {
    const saved = localStorage.getItem(CHAT_MESSAGES_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [{ role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE, timestamp: new Date() }];
  } catch {
    return [{ role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE, timestamp: new Date() }];
  }
}

function extractSubtopic(text) {
  if (!text || typeof text !== 'string') return '';

  const followUpMatch = text.match(/follow-?up\s*:\s*(?:what|how|why|when|where|which)?\s*(?:would|does|do|can|could|is|are)?\s*(?:happen|affect|change|impact|influence)?\s*(?:if)?\s*(?:the)?\s*([A-Za-z][A-Za-z\s-]{2,40})\?/i);
  if (followUpMatch?.[1]) return followUpMatch[1].trim();

  const labelMatch = text.match(/(?:topic|subtopic|focus)\s*:\s*([A-Za-z][A-Za-z\s-]{2,40})/i);
  if (labelMatch?.[1]) return labelMatch[1].trim();

  const aboutMatch = text.match(/\b(?:about|on|the role of|the concept of)\s+([A-Za-z][A-Za-z\s-]{2,40})/i);
  return aboutMatch?.[1]?.trim() || '';
}

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
             style={{ background: 'rgba(13,13,24,0.4)', backdropFilter: 'blur(20px)' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="mb-3 pl-5 list-disc space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="mb-3 pl-5 list-decimal space-y-1">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
              code: ({ children }) => <code className="text-primary bg-surface-container-highest/70 px-1 py-0.5 rounded">{children}</code>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        <span className="text-[0.6875rem] font-medium tracking-widest text-outline uppercase ml-1">
          TutorAI · {time}
        </span>
      </div>
    </div>
  );
}

export default function Chat() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [messages,  setMessages]  = useState(getSavedMessages);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [topic,     setTopic]     = useState(() => localStorage.getItem(CHAT_TOPIC_KEY) || 'Mathematics');
  const [lastSubtopic, setLastSubtopic] = useState('');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(CHAT_SESSION_KEY) || null);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const streamRef = useRef(null);
  const quizTopic = 'Current Chat';

  const closeStream = () => {
    if (streamRef.current) {
      streamRef.current.close();
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const generateQuizFromChat = () => {
    if (sessionId) {
      navigate(`/quiz?topic=${encodeURIComponent(quizTopic)}&sessionId=${sessionId}`);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (sessionId) localStorage.setItem(CHAT_SESSION_KEY, sessionId);
    else localStorage.removeItem(CHAT_SESSION_KEY);
  }, [sessionId]);

  useEffect(() => {
    localStorage.setItem(CHAT_TOPIC_KEY, topic);
  }, [topic]);

  useEffect(() => {
    if (!token) return;

    const params = new URLSearchParams(location.search);
    const topicFromQuery = params.get('topic');
    const sessionFromQuery = params.get('sessionId');

    if (topicFromQuery) {
      setTopic(topicFromQuery);
      setLastSubtopic('');
    }

    if (!sessionFromQuery) return;

    setLoading(true);
    apiFetch(`/api/chat/history/${sessionFromQuery}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load chat session');
        return res.json();
      })
      .then((chat) => {
        setSessionId(chat._id || sessionFromQuery);
        setTopic(chat.topic || topicFromQuery || 'General');
        if (Array.isArray(chat.messages) && chat.messages.length > 0) {
          const lastAssistant = [...chat.messages].reverse().find(m => m.role === 'assistant');
          setLastSubtopic(extractSubtopic(lastAssistant?.content || ''));
          setMessages(chat.messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || new Date(),
          })));
        } else {
          setLastSubtopic('');
          setMessages([{ role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE, timestamp: new Date() }]);
        }
      })
      .catch(() => {
        setSessionId(null);
        setLastSubtopic('');
      })
      .finally(() => setLoading(false));
  }, [location.search, token]);

  useEffect(() => () => closeStream(), []);

  const sendMessageFallback = async (userMsg) => {
    const res = await apiFetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: userMsg.content, topic, sessionId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Chat failed');

    if (data.sessionId) setSessionId(data.sessionId);
    setLastSubtopic(extractSubtopic(data.response));
    setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: new Date() }]);
  };

  const sendMessageStreaming = async (userMsg) => {
    const initRes = await apiFetch('/api/chat/stream-init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: userMsg.content, topic, sessionId }),
    });

    const initData = await initRes.json();
    if (!initRes.ok || !initData.streamId) {
      throw new Error(initData.error || 'Failed to start stream');
    }

    const assistantId = `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const assistantPlaceholder = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
    };

    setMessages(prev => [...prev, assistantPlaceholder]);

    await new Promise((resolve, reject) => {
      let fullText = '';
      let idleTimer = null;
      let totalTimer = null;

      const clearTimers = () => {
        if (idleTimer) clearTimeout(idleTimer);
        if (totalTimer) clearTimeout(totalTimer);
      };

      const bumpIdleTimer = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          reject(new Error('Stream timed out while waiting for next chunk'));
        }, STREAM_IDLE_TIMEOUT_MS);
      };

      const es = new EventSource(apiUrl(`/api/chat/stream/${initData.streamId}`), { withCredentials: true });
      streamRef.current = es;
      setIsStreaming(true);
      bumpIdleTimer();
      totalTimer = setTimeout(() => {
        reject(new Error('Stream exceeded maximum duration'));
      }, STREAM_TOTAL_TIMEOUT_MS);

      es.onopen = () => {
        bumpIdleTimer();
      };

      es.addEventListener('chunk', (event) => {
        try {
          const payload = JSON.parse(event.data);
          const piece = payload?.content || '';
          if (!piece) return;

          fullText += piece;
          bumpIdleTimer();
          setMessages(prev => prev.map((msg) => (
            msg.id === assistantId ? { ...msg, content: msg.content + piece } : msg
          )));
        } catch {
          // Ignore malformed chunk payloads.
        }
      });

      es.addEventListener('done', (event) => {
        try {
          const payload = JSON.parse(event.data || '{}');
          if (payload.sessionId) setSessionId(payload.sessionId);
          setLastSubtopic(extractSubtopic(fullText));
          setMessages(prev => prev.map((msg) => (
            msg.id === assistantId
              ? { ...msg, content: msg.content || fullText || 'I could not generate a response.', streaming: false }
              : msg
          )));
        } finally {
          clearTimers();
          es.close();
          streamRef.current = null;
          setIsStreaming(false);
          resolve();
        }
      });

      es.addEventListener('error', (event) => {
        try {
          let errMsg = 'Stream failed';
          if (event?.data) {
            const payload = JSON.parse(event.data);
            errMsg = payload.error || errMsg;
          }
          reject(new Error(errMsg));
        } catch {
          reject(new Error('Stream failed'));
        } finally {
          clearTimers();
          es.close();
          streamRef.current = null;
          setIsStreaming(false);
          setMessages(prev => prev.filter((msg) => msg.id !== assistantId));
        }
      });
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    closeStream();

    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      await sendMessageStreaming(userMsg);
    } catch {
      setIsStreaming(false);
      try {
        await sendMessageFallback(userMsg);
      } catch {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date(),
        }]);
      }
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
              onChange={e => {
                setTopic(e.target.value);
                setLastSubtopic('');
                setMessages([{ role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE, timestamp: new Date() }]);
                setSessionId(null);
                localStorage.removeItem(CHAT_MESSAGES_KEY);
                localStorage.removeItem(CHAT_SESSION_KEY);
              }}
              className="px-4 py-2 text-sm font-medium tracking-widest uppercase text-on-surface bg-surface-container-high border border-outline-variant/30 rounded-lg hover:border-primary/40 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all appearance-none pr-8"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgb(189, 157, 255)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.7rem center',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem',
              }}
            >
              {TOPICS.map(t => <option key={t} value={t} style={{ backgroundColor: '#1e1e2d', color: '#e9e6f7' }}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            {isStreaming && (
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Streaming
              </span>
            )}
            <button
              onClick={generateQuizFromChat}
              disabled={!sessionId}
              className="px-4 py-1.5 text-xs font-semibold text-on-primary bg-gradient-to-r from-[#bd9dff] to-[#8a4cfc] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Quiz on Current Chat
            </button>
            <button
              disabled
              title="Focus Mode coming soon"
              aria-label="Focus Mode (coming soon)"
              className="px-4 py-1.5 text-xs font-semibold text-on-surface-variant/60 border border-outline-variant/30 rounded-lg cursor-not-allowed opacity-50"
            >
              Focus Mode
            </button>
            <button onClick={() => {
              closeStream();
              setMessages([{ role: 'assistant', content: INITIAL_ASSISTANT_MESSAGE, timestamp: new Date() }]);
              setSessionId(null);
              setLastSubtopic('');
              setLoading(false);
              localStorage.removeItem(CHAT_MESSAGES_KEY);
              localStorage.removeItem(CHAT_SESSION_KEY);
            }}
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
                <div className="flex items-center gap-3">
                  <span className="text-[0.6875rem] text-on-surface-variant tracking-wide px-1 uppercase font-semibold">
                    Enter to send · Shift+Enter for new line
                  </span>
                  {isStreaming && (
                    <span className="inline-flex items-center gap-1 text-[0.625rem] font-bold uppercase tracking-widest text-primary/85">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                      Real-time
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled
                    title="Document attach coming soon"
                    aria-label="Attach document (coming soon)"
                    className="p-2 rounded-lg text-on-surface-variant/60 cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                  <span className="self-center text-[10px] uppercase tracking-widest text-on-surface-variant/60">
                    Coming soon
                  </span>
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
