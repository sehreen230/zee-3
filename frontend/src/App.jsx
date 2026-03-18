import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8001";
const fmtDate = (d) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short" });
const urgency = (deadline) => {
  const days = Math.ceil((new Date(deadline) - Date.now()) / 86400000);
  if (days < 0) return "overdue";
  if (days <= 2) return "urgent";
  if (days <= 7) return "soon";
  return "ok";
};
const URGENCY_STYLE = {
  overdue: { bg: "#fee2e2", color: "#991b1b", label: "Overdue" },
  urgent:  { bg: "#fef3c7", color: "#92400e", label: "Due soon" },
  soon:    { bg: "#dbeafe", color: "#1e3a5f", label: "This week" },
  ok:      { bg: "#dcfce7", color: "#14532d", label: "Upcoming" },
};
const MOCK_ASSIGNMENTS = [
  { id: 1, course: "CS-401", title: "Neural Network Implementation", deadline: "2026-03-18", type: "assignment", submitted: false },
  { id: 2, course: "MTH-301", title: "Linear Algebra Quiz 3", deadline: "2026-03-17", type: "quiz", submitted: false },
  { id: 3, course: "ENG-201", title: "Research Paper Draft", deadline: "2026-03-25", type: "assignment", submitted: true },
  { id: 4, course: "CS-402", title: "Database Design Project", deadline: "2026-04-01", type: "project", submitted: false },
  { id: 5, course: "PHY-301", title: "Lab Report #4", deadline: "2026-03-20", type: "assignment", submitted: false },
];
const MOCK_ATTENDANCE = [
  { course: "CS-401", name: "Artificial Intelligence", attended: 18, total: 22, percent: 82 },
  { course: "MTH-301", name: "Linear Algebra", attended: 20, total: 22, percent: 91 },
  { course: "ENG-201", name: "Technical Writing", attended: 15, total: 22, percent: 68 },
  { course: "CS-402", name: "Database Systems", attended: 21, total: 22, percent: 95 },
  { course: "PHY-301", name: "Physics Lab", attended: 19, total: 22, percent: 86 },
];

function Sidebar({ active, setActive, syncing, onSync }) {
  const nav = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "deadlines", icon: "◷", label: "Deadlines" },
    { id: "attendance", icon: "◈", label: "Attendance" },
    { id: "tutor", icon: "◉", label: "AI Tutor" },
    { id: "quiz", icon: "◎", label: "Quiz Prep" },
    { id: "settings", icon: "◧", label: "Settings" },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">◈</span>
        <span className="brand-name">UniAgent</span>
      </div>
      <nav className="sidebar-nav">
        {nav.map((n) => (
          <button key={n.id} className={`nav-item ${active === n.id ? "active" : ""}`} onClick={() => setActive(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </button>
        ))}
      </nav>
      <button className="sync-btn" onClick={onSync} disabled={syncing}>
        <span className={syncing ? "spin" : ""}>↻</span>
        {syncing ? "Syncing…" : "Sync Portal"}
      </button>
    </aside>
  );
}

function Dashboard({ assignments, attendance }) {
  const pending = assignments.filter((a) => !a.submitted);
  const overdue = pending.filter((a) => urgency(a.deadline) === "overdue");
  const dueToday = pending.filter((a) => urgency(a.deadline) === "urgent");
  const avgAtt = Math.round(attendance.reduce((s, c) => s + c.percent, 0) / attendance.length);
  const lowAtt = attendance.filter((c) => c.percent < 75);
  return (
    <div className="page">
      <h1 className="page-title">Good day 👋</h1>
      <p className="page-sub">Your COMSATS academic snapshot</p>
      <div className="stats-row">
        <div className="stat-card"><div className="stat-value">{pending.length}</div><div className="stat-label">Pending tasks</div><div className="stat-sub">{overdue.length} overdue</div></div>
        <div className="stat-card"><div className="stat-value">{dueToday.length}</div><div className="stat-label">Due in 48h</div><div className="stat-sub">Act now</div></div>
        <div className="stat-card"><div className="stat-value">{avgAtt}%</div><div className="stat-label">Avg attendance</div><div className="stat-sub">{attendance.length} courses</div></div>
        <div className="stat-card"><div className="stat-value">{lowAtt.length}</div><div className="stat-label">Low attendance</div><div className="stat-sub">Below 75%</div></div>
      </div>
      {overdue.length > 0 && <div className="alert-banner">⚠ You have {overdue.length} overdue submission{overdue.length > 1 ? "s" : ""}. Submit immediately!</div>}
      <div className="two-col">
        <section className="card">
          <h2 className="card-title">Upcoming deadlines</h2>
          {pending.slice(0, 4).map((a) => {
            const s = URGENCY_STYLE[urgency(a.deadline)];
            return (
              <div key={a.id} className="deadline-row">
                <div className="deadline-meta"><span className="course-pill">{a.course}</span><span className="deadline-title">{a.title}</span></div>
                <div className="deadline-right"><span className="deadline-date">{fmtDate(a.deadline)}</span><span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span></div>
              </div>
            );
          })}
        </section>
        <section className="card">
          <h2 className="card-title">Attendance overview</h2>
          {attendance.map((c) => (
            <div key={c.course} className="att-row">
              <div className="att-meta"><span className="course-pill">{c.course}</span><span className="att-name">{c.name}</span></div>
              <div className="att-bar-track"><div className="att-bar-fill" style={{ width: `${c.percent}%`, background: c.percent < 75 ? "#ef4444" : c.percent < 85 ? "#f59e0b" : "#22c55e" }} /></div>
              <span className="att-pct" style={{ color: c.percent < 75 ? "#ef4444" : c.percent < 85 ? "#f59e0b" : "#22c55e" }}>{c.percent}%</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function Deadlines({ assignments }) {
  const [filter, setFilter] = useState("all");
  const filtered = assignments.filter((a) => filter === "all" ? true : filter === "pending" ? !a.submitted : filter === "done" ? a.submitted : a.type === filter);
  return (
    <div className="page">
      <h1 className="page-title">Deadlines</h1>
      <div className="filter-row">
        {["all","pending","done","quiz"].map((f) => <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase()+f.slice(1)}</button>)}
      </div>
      <div className="deadline-list">
        {filtered.map((a) => {
          const s = URGENCY_STYLE[urgency(a.deadline)];
          return (
            <div key={a.id} className={`deadline-card ${a.submitted ? "submitted" : ""}`}>
              <div className="dc-left"><span className="course-pill">{a.course}</span><div className="dc-title">{a.title}</div><div className="dc-type">{a.type}</div></div>
              <div className="dc-right"><div className="dc-date">{fmtDate(a.deadline)}</div>
                {a.submitted ? <span className="badge" style={{ background: "#dcfce7", color: "#14532d" }}>Submitted ✓</span> : <span className="badge" style={{ background: s.bg, color: s.color }}>{s.label}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Attendance({ attendance }) {
  return (
    <div className="page">
      <h1 className="page-title">Attendance tracker</h1>
      <p className="page-sub">Minimum required: 75% per course. Auto-updated from COMSATS CMS.</p>
      <div className="att-cards">
        {attendance.map((c) => (
          <div key={c.course} className={`att-card ${c.percent < 75 ? "danger" : c.percent < 85 ? "warn" : "ok"}`}>
            <div className="att-card-header"><span className="course-pill">{c.course}</span><span className="att-big">{c.percent}%</span></div>
            <div className="att-card-name">{c.name}</div>
            <div className="att-bar-track"><div className="att-bar-fill" style={{ width: `${c.percent}%`, background: c.percent < 75 ? "#ef4444" : c.percent < 85 ? "#f59e0b" : "#22c55e" }} /></div>
            <div className="att-card-stats"><span>{c.attended} attended</span><span>{c.total - c.attended} missed</span><span>{c.total} total</span></div>
            {c.percent < 75 && <div className="att-warning">⚠ Need {Math.ceil(c.total * 0.75) - c.attended} more classes to reach 75%</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function AITutor() {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hello! I am your COMSATS AI tutor powered by Claude. Ask me anything about your courses!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, userMsg] }) });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Could not connect to backend. Make sure the server is running on port 8001." }]);
    }
    setLoading(false);
  };

  return (
    <div className="page tutor-page">
      <h1 className="page-title">AI Tutor</h1>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.role === "assistant" && <span className="msg-avatar">◉</span>}
              <div className="msg-bubble">{m.content}</div>
            </div>
          ))}
          {loading && <div className="msg assistant"><span className="msg-avatar">◉</span><div className="msg-bubble typing"><span/><span/><span/></div></div>}
          <div ref={bottomRef} />
        </div>
        <div className="quick-prompts">
          {["Explain neural networks","Help with linear algebra","What is database normalization?","How to write a research paper"].map((q) => (
            <button key={q} className="quick-btn" onClick={() => setInput(q)}>{q}</button>
          ))}
        </div>
        <div className="chat-input-row">
          <input className="chat-input" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask anything about your courses…" />
          <button className="send-btn" onClick={send} disabled={loading || !input.trim()}>→</button>
        </div>
      </div>
    </div>
  );
}

function QuizPrep({ assignments }) {
  const [selected, setSelected] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const courses = [...new Set(assignments.map((a) => a.course))];

  const generate = async () => {
    if (!selected) return;
    setLoading(true); setQuiz(null); setAnswers({}); setChecked(false);
    try {
      const res = await fetch(`${API}/quiz/generate?course=${selected}&count=4`, { method: "POST" });
      const data = await res.json();
      setQuiz(data.questions);
    } catch {
      setQuiz([{ q: "Backend not connected. Start the server to generate quiz questions.", options: ["OK"], answer: 0 }]);
    }
    setLoading(false);
  };

  const score = quiz ? quiz.filter((q, i) => answers[i] === q.answer).length : 0;
  return (
    <div className="page">
      <h1 className="page-title">Quiz Prep</h1>
      <p className="page-sub">AI-generated practice questions for your courses</p>
      <div className="quiz-selector">
        <div className="course-grid">{courses.map((c) => <button key={c} className={`course-btn ${selected === c ? "active" : ""}`} onClick={() => setSelected(c)}>{c}</button>)}</div>
        <button className="gen-btn" onClick={generate} disabled={!selected || loading}>{loading ? "Generating…" : "Generate quiz →"}</button>
      </div>
      {quiz && (
        <div className="quiz-questions">
          {quiz.map((q, i) => (
            <div key={i} className="quiz-q">
              <div className="quiz-q-text">{i+1}. {q.q}</div>
              <div className="quiz-options">
                {q.options.map((opt, j) => {
                  let cls = "quiz-opt";
                  if (checked) { if (j === q.answer) cls += " correct"; else if (answers[i] === j) cls += " wrong"; }
                  else if (answers[i] === j) cls += " selected";
                  return <button key={j} className={cls} onClick={() => !checked && setAnswers({...answers, [i]: j})}>{["A","B","C","D"][j]}. {opt}</button>;
                })}
              </div>
            </div>
          ))}
          {!checked
            ? <button className="gen-btn" onClick={() => setChecked(true)} disabled={Object.keys(answers).length < quiz.length}>Check answers</button>
            : <div className="quiz-result">Score: {score}/{quiz.length} — {score === quiz.length ? "🎉 Perfect!" : score >= quiz.length * 0.7 ? "👍 Good job!" : "📚 Keep studying!"}</div>
          }
        </div>
      )}
    </div>
  );
}

function Settings() {
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [saved, setSaved] = useState(false);
  const save = async () => {
    try {
      await fetch(`${API}/settings/credentials`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(creds) });
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <div className="settings-card">
        <h2 className="card-title">COMSATS CMS credentials</h2>
        <p className="page-sub">Stored locally on your Mac only.</p>
        <div className="form-group"><label>Roll Number</label><input className="form-input" type="text" value={creds.username} onChange={(e) => setCreds({...creds, username: e.target.value})} placeholder="e.g. FA22-BCS-001" /></div>
        <div className="form-group"><label>Password</label><input className="form-input" type="password" value={creds.password} onChange={(e) => setCreds({...creds, password: e.target.value})} placeholder="••••••••" /></div>
        <button className="gen-btn" onClick={save}>{saved ? "Saved ✓" : "Save settings"}</button>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [syncing, setSyncing] = useState(false);
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);
  const [attendance, setAttendance] = useState(MOCK_ATTENDANCE);

  const handleSync = async () => { 
    setSyncing(true); 
    try { 
      const res = await fetch(`${API}/sync`, { method: "POST" }); 
      const data = await res.json();
      
      // If the backend returned actual data, update the React state
      if (data.status === "success" && data.assignments && data.attendance) {
        setAssignments(data.assignments);
        setAttendance(data.attendance);
      } else if (data.status === "success") {
        // Just proof of concept that the sync script ran successfully
        alert(data.message);
      } else if (data.error) {
        alert("Sync error: " + data.error);
      }
    } catch (e) {
      alert("Error connecting to backend: " + e.message);
    } 
    setSyncing(false); 
  };

  const pages = { 
    dashboard: <Dashboard assignments={assignments} attendance={attendance} />, 
    deadlines: <Deadlines assignments={assignments} />, 
    attendance: <Attendance attendance={attendance} />, 
    tutor: <AITutor />, 
    quiz: <QuizPrep assignments={assignments} />, 
    settings: <Settings /> 
  };

  return (
    <div className="app">
      <Sidebar active={active} setActive={setActive} syncing={syncing} onSync={handleSync} />
      <main className="main">{pages[active]}</main>
    </div>
  );
}
