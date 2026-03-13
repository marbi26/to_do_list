import { useState, useMemo, useEffect, useRef } from "react";

const PRIORITIES = ["Low", "Medium", "High"];
const PRIORITY_STYLES = {
  Low:    { color: "#7c6f5e", bg: "#f0ebe3" },
  Medium: { color: "#a07850", bg: "#f5ead8" },
  High:   { color: "#c2614a", bg: "#f7e0d8" },
};
const DEFAULT_TAGS = ["Work", "Personal", "Shopping", "Health"];
const TAG_COLORS = ["#b09080", "#8fa899", "#b8a87a", "#a08898", "#7a94a8", "#9e8a70"];

const getLocalDate = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
};

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}
function isOverdue(d) {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toDateString());
}

function TaskCard({ task, onToggle, onDelete }) {
  const [visible, setVisible] = useState(false);
  const [removing, setRemoving] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const handleDelete = () => {
    setRemoving(true);
    setTimeout(() => onDelete(task.id), 350);
  };

  return (
    <div style={{
      background: task.done ? "rgba(245,240,234,0.5)" : "#fdfaf6",
      borderRadius: 16,
      padding: "14px 16px",
      boxShadow: "0 2px 12px rgba(160,130,100,0.08)",
      border: `1.5px solid ${task.done ? "#ede5d8" : "#e8ddd0"}`,
      display: "flex", alignItems: "center", gap: 12,
      opacity: removing ? 0 : visible ? (task.done ? 0.6 : 1) : 0,
      transform: removing
        ? "translateX(60px) scale(0.92)"
        : visible ? "translateY(0) scale(1)" : "translateY(18px) scale(0.97)",
      transition: removing
        ? "all 0.35s cubic-bezier(.4,0,.2,1)"
        : "all 0.42s cubic-bezier(.34,1.56,.64,1)",
    }}>
      <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)}
        style={{ width: 18, height: 18, accentColor: "#b09080", cursor: "pointer", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: task.done ? "#c4b5a5" : "#5c4a38",
          textDecoration: task.done ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          transition: "color 0.3s"
        }}>{task.text}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
          {task.date && (
            <span style={{ fontSize: 11, color: isOverdue(task.date) && !task.done ? "#c2614a" : "#b09a86", fontWeight: 500 }}>
              📅 {formatDate(task.date)}{isOverdue(task.date) && !task.done ? " · Overdue" : ""}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700,
            color: PRIORITY_STYLES[task.priority].color,
            background: PRIORITY_STYLES[task.priority].bg,
            borderRadius: 20, padding: "1px 9px" }}>
            {task.priority}
          </span>
          <span style={{
            fontSize: 11,
            background: (task.tagColor || "#b09080") + "22",
            color: task.tagColor || "#b09080",
            borderRadius: 20, padding: "1px 9px", fontWeight: 600,
            border: `1px solid ${(task.tagColor || "#b09080")}44`
          }}>{task.tag}</span>
        </div>
      </div>
      <button onClick={handleDelete}
        style={{ background: "#f0ebe3", border: "none", cursor: "pointer", color: "#c4b5a5", fontSize: 14, padding: "6px 9px", borderRadius: 9, flexShrink: 0, transition: "all 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f7e0d8"; e.currentTarget.style.color = "#c2614a"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#f0ebe3"; e.currentTarget.style.color = "#c4b5a5"; }}>
        ✕
      </button>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [date, setDate] = useState(getLocalDate());
  const [priority, setPriority] = useState("Medium");
  const [tag, setTag] = useState("Personal");
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [newTag, setNewTag] = useState("");
  const [sortBy, setSortBy] = useState("None");
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagColorMap, setTagColorMap] = useState(() => {
    const m = {};
    DEFAULT_TAGS.forEach((t, i) => (m[t] = TAG_COLORS[i % TAG_COLORS.length]));
    return m;
  });
  const inputRef = useRef();

  const addTask = () => {
    if (!text.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now(), text: text.trim(), done: false,
      date, priority, tag, tagColor: tagColorMap[tag]
    }]);
    setText(""); setDate(getLocalDate()); setPriority("Medium");
    inputRef.current?.focus();
  };

  const toggle = id => setTasks(p => p.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const del = id => setTasks(p => p.filter(t => t.id !== id));

  const addTag = () => {
    const t = newTag.trim();
    if (!t || tags.includes(t)) return;
    const color = TAG_COLORS[tags.length % TAG_COLORS.length];
    setTags(p => [...p, t]);
    setTagColorMap(p => ({ ...p, [t]: color }));
    setNewTag(""); setShowTagInput(false); setTag(t);
  };

  const displayed = useMemo(() => {
    let list = [...tasks];
    if (sortBy === "Priority") list.sort((a, b) => PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority));
    else if (sortBy === "Due Date") list.sort((a, b) => (a.date || "9999") > (b.date || "9999") ? 1 : -1);
    return list;
  }, [tasks, sortBy]);

  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const inputStyle = {
    border: "1.5px solid #e0d5c8", borderRadius: 10,
    padding: "7px 11px", fontSize: 13,
    color: "#5c4a38", outline: "none",
    background: "#fdf8f3", transition: "box-shadow 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5ede2", fontFamily: "'Segoe UI', sans-serif", padding: "0 0 40px" }}>
      <style>{`
        @keyframes slideDown { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .add-btn:hover { background: #8a6f58 !important; transform: scale(1.04) translateY(-1px); }
        .add-btn { transition: all 0.2s cubic-bezier(.34,1.56,.64,1); }
        input:focus, select:focus { box-shadow: 0 0 0 3px rgba(176,144,128,0.2) !important; }
      `}</style>

      {/* Hero banner with warm nature image */}
      <div style={{ position: "relative", width: "100%", height: 210, overflow: "hidden" }}>
        <img
          src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80"
          alt="peaceful nature"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 60%" }}
        />
        {/* overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(90,60,40,0.35) 0%, rgba(90,60,40,0.55) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fdf6ee", margin: 0, letterSpacing: "-0.5px", textShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
            My Tasks
          </h1>
          <p style={{ color: "#f0dfc8", fontSize: 13, margin: "6px 0 0", fontWeight: 500 }}>
            {tasks.filter(t => !t.done).length} remaining · {done} completed
          </p>
          {total > 0 && (
            <div style={{ marginTop: 14, background: "rgba(255,255,255,0.2)", borderRadius: 99, height: 7, width: 220, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, background: "#f0c8a0", width: `${pct}%`, transition: "width 0.6s cubic-bezier(.34,1.56,.64,1)" }} />
            </div>
          )}
          {total > 0 && <p style={{ color: "#f0dfc8", fontSize: 11, marginTop: 4 }}>{pct}% complete</p>}
        </div>
      </div>

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "24px 16px 0", position: "relative", zIndex: 1 }}>

        {/* Add Task Card */}
        <div style={{ background: "#fdfaf6", borderRadius: 20, padding: 20, boxShadow: "0 4px 24px rgba(160,130,100,0.12)", marginBottom: 20, border: "1.5px solid #ede5d8", animation: "slideDown 0.5s ease" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input ref={inputRef}
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTask()}
              placeholder="What needs to be done?"
              style={{ ...inputStyle, flex: 1, padding: "10px 14px", fontSize: 14 }}
            />
            <button className="add-btn" onClick={addTask}
              style={{ background: "#a07860", color: "#fdf6ee", border: "none", borderRadius: 12, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 12px rgba(160,120,96,0.3)" }}>
              + Add
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            <select value={priority} onChange={e => setPriority(e.target.value)} style={inputStyle}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={tag} onChange={e => setTag(e.target.value)} style={inputStyle}>
              {tags.map(t => <option key={t}>{t}</option>)}
            </select>
            <button onClick={() => setShowTagInput(v => !v)}
              style={{ border: "1.5px dashed #d0c0b0", borderRadius: 10, padding: "6px 11px", fontSize: 13, color: "#b09080", background: "none", cursor: "pointer", transition: "all 0.2s" }}>
              🏷️ Tag
            </button>
          </div>
          {showTagInput && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, animation: "slideDown 0.3s ease" }}>
              <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()}
                placeholder="New tag name…" style={{ ...inputStyle, flex: 1 }} />
              <button onClick={addTag}
                style={{ background: "#a07860", color: "#fdf6ee", border: "none", borderRadius: 10, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600, transition: "all 0.2s" }}>
                Create
              </button>
            </div>
          )}
        </div>

        {/* Sort */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inputStyle, fontSize: 12 }}>
            <option>None</option>
            <option>Priority</option>
            <option>Due Date</option>
          </select>
        </div>

        {/* Task List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayed.length === 0 && (
            <div style={{ textAlign: "center", padding: "52px 0", color: "#c4b5a5", fontSize: 15, animation: "fadeIn 0.5s ease" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🌿</div>
              Nothing here yet — add your first task!
            </div>
          )}
          {displayed.map(task => (
            <TaskCard key={task.id} task={task} onToggle={toggle} onDelete={del} />
          ))}
        </div>

        {tasks.length > 0 && tasks.some(t => t.done) && (
          <button onClick={() => setTasks(p => p.filter(t => !t.done))}
            style={{ marginTop: 18, background: "transparent", border: "1.5px solid #e0d5c8", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#b09a86", cursor: "pointer", width: "100%", fontWeight: 600, transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f0ebe3"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            🗑️ Clear completed tasks
          </button>
        )}
      </div>
    </div>
  );
}