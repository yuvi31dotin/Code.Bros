"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Todo = { _id: string; title: string; completed: boolean; createdAt: string };
type RecentDay = { date: string; label: string; completed: boolean };
type Progress = { today: boolean; currentStreak: number; longestStreak: number; recent: RecentDay[] };
type ChatMessage = { role: "user" | "assistant"; text: string };

const emptyProgress: Progress = { today: false, currentStreak: 0, longestStreak: 0, recent: [] };

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [newTodo, setNewTodo] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [error, setError] = useState("");
  const [todayLabel, setTodayLabel] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{ role: "assistant", text: "Ask me about your todo list, time management, or managing studies." }]);

  useEffect(() => {
    const dateTimer = window.setTimeout(() => setTodayLabel(new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date())), 0);
    Promise.all([fetch("/api/todos"), fetch("/api/progress")])
      .then(async ([todosResponse, progressResponse]) => {
        if (!todosResponse.ok || !progressResponse.ok) throw new Error("Connect your MongoDB database to load your workspace.");
        const todosData = await todosResponse.json();
        const progressData = await progressResponse.json();
        setTodos(todosData.todos ?? []);
        setProgress(progressData);
      })
      .catch((reason: Error) => setError(reason.message))
      .finally(() => setLoading(false));
    return () => window.clearTimeout(dateTimer);
  }, []);

  const visibleTodos = useMemo(() => todos.filter((todo) => filter === "all" || (filter === "done" ? todo.completed : !todo.completed)), [todos, filter]);
  const remaining = todos.filter((todo) => !todo.completed).length;
  const completed = todos.length - remaining;
  async function addTodo(event: FormEvent) {
    event.preventDefault();
    if (!newTodo.trim()) return;
    const response = await fetch("/api/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTodo }) });
    if (!response.ok) return setError("That task could not be saved.");
    const data = await response.json();
    setTodos((current) => [data.todo, ...current]);
    setNewTodo("");
  }

  async function toggleTodo(todo: Todo) {
    setTodos((current) => current.map((item) => item._id === todo._id ? { ...item, completed: !item.completed } : item));
    const response = await fetch(`/api/todos/${todo._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !todo.completed }) });
    if (!response.ok) setTodos((current) => current.map((item) => item._id === todo._id ? todo : item));
  }

  async function deleteTodo(id: string) {
    setTodos((current) => current.filter((todo) => todo._id !== id));
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  }

  async function toggleToday() {
    setSavingProgress(true);
    const method = progress.today ? "DELETE" : "POST";
    const response = await fetch("/api/progress", { method });
    if (response.ok) {
      const refreshed = await fetch("/api/progress");
      setProgress(await refreshed.json());
    }
    setSavingProgress(false);
  }

  async function sendChat(event: FormEvent) {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatBusy) return;
    setChatInput("");
    setChatMessages((current) => [...current, { role: "user", text: message }]);
    setChatBusy(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      const data = await response.json();
      setChatMessages((current) => [...current, { role: "assistant", text: data.reply ?? "Can't help with that you can ask a different question" }]);
    } catch {
      setChatMessages((current) => [...current, { role: "assistant", text: "The study coach is unavailable right now. Please try again shortly." }]);
    } finally {
      setChatBusy(false);
    }
  }

  if (loading) return <main className="loading-screen"><span className="spinner" /> Loading your workspace</main>;

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-dot" /> daymark</div><div className="topbar-actions"><div className="topbar-note"><span className="status-dot" /> No sign-in required</div><button className={`coach-launcher ${chatOpen ? "active" : ""}`} onClick={() => setChatOpen((open) => !open)} aria-expanded={chatOpen}><span>✦</span> Study coach</button></div></header>
    <section className="workspace">
      <div className="welcome-row"><div><p className="eyebrow">Your daily practice</p><h1>Make today count.</h1><p className="date-stamp">{todayLabel}</p></div><div className="streak-badge"><span className="flame">✦</span><strong>{progress.currentStreak}</strong><span>day streak</span></div></div>
      {error && <div className="connection-error"><strong>Workspace unavailable.</strong> {error}<button onClick={() => window.location.reload()}>Retry</button></div>}
      <section className="progress-panel"><div className="progress-heading"><div><p className="eyebrow">Daily process</p><h2>Show up for yourself.</h2></div><button className={`check-in ${progress.today ? "checked" : ""}`} onClick={toggleToday} disabled={savingProgress}><span>{progress.today ? "✓" : "○"}</span>{savingProgress ? "Saving..." : progress.today ? "Today complete" : "Mark today complete"}</button></div><div className="progress-bottom"><div className="week-strip">{progress.recent.map((day) => <div className={`week-day ${day.completed ? "complete" : ""}`} key={day.date}><span>{day.label}</span><i>{day.completed ? "✓" : ""}</i></div>)}</div><div className="streak-stats"><div><strong>{progress.longestStreak}</strong><span>best streak</span></div><div><strong>{completed}</strong><span>tasks done</span></div></div></div></section>
      <form className="todo-entry" onSubmit={addTodo}><span className="plus">+</span><input value={newTodo} onChange={(event) => setNewTodo(event.target.value)} placeholder="What needs your attention?" /><button aria-label="Add todo">Add task</button></form>
      <div className="list-header"><div><span className="count">{remaining}</span><span className="muted"> {remaining === 1 ? "thing" : "things"} left to do</span></div><nav className="filters">{(["all", "active", "done"] as const).map((item) => <button type="button" key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}</nav></div>
      <div className="todo-list">{visibleTodos.length === 0 ? <div className="empty-state"><span>✦</span><h3>{todos.length === 0 ? "A clean slate." : "Nothing here."}</h3><p>{todos.length === 0 ? "Add your first task above and let the day take shape." : "Try another view to see more of your list."}</p></div> : visibleTodos.map((todo) => <article className={`todo-item ${todo.completed ? "is-done" : ""}`} key={todo._id}><button className="check" aria-label={todo.completed ? "Mark incomplete" : "Mark complete"} onClick={() => toggleTodo(todo)}>{todo.completed ? "✓" : ""}</button><span className="todo-title">{todo.title}</span><button className="delete-button" aria-label="Delete todo" onClick={() => deleteTodo(todo._id)}>×</button></article>)}</div>
    </section>
    {chatOpen && <aside className="chat-panel" aria-label="Study coach"><div className="chat-header"><div><p className="eyebrow">Gemini study coach</p><h2>Plan a better next step.</h2></div><button className="chat-close" onClick={() => setChatOpen(false)} aria-label="Close study coach">×</button></div><div className="chat-messages">{chatMessages.map((message, index) => <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}{chatBusy && <div className="chat-message assistant typing">Thinking...</div>}</div><form className="chat-form" onSubmit={sendChat}><input value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Ask about planning or studying..." aria-label="Ask the study coach" /><button aria-label="Send question" disabled={chatBusy || !chatInput.trim()}>↑</button></form></aside>}
    <footer className="app-footer"><span>daymark</span><span>Small steps, kept visible.</span></footer>
  </main>;
}
