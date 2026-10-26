"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Todo = { _id: string; title: string; completed: boolean; createdAt: string };
type User = { name: string; email: string };

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [newTodo, setNewTodo] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then(async (response) => {
      if (!response.ok) return setLoading(false);
      const data = await response.json();
      setUser(data.user);
      const todoResponse = await fetch("/api/todos");
      if (todoResponse.ok) setTodos((await todoResponse.json()).todos);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const visibleTodos = useMemo(() => todos.filter((todo) => filter === "all" || (filter === "done" ? todo.completed : !todo.completed)), [todos, filter]);
  const remaining = todos.filter((todo) => !todo.completed).length;

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Something went wrong.");
    else { setUser(data.user); setForm({ name: "", email: "", password: "" }); const todosResponse = await fetch("/api/todos"); setTodos((await todosResponse.json()).todos ?? []); }
    setBusy(false);
  }

  async function addTodo(event: FormEvent) {
    event.preventDefault();
    if (!newTodo.trim()) return;
    const response = await fetch("/api/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTodo }) });
    if (response.ok) { const data = await response.json(); setTodos((current) => [data.todo, ...current]); setNewTodo(""); }
  }

  async function toggleTodo(todo: Todo) {
    setTodos((current) => current.map((item) => item._id === todo._id ? { ...item, completed: !item.completed } : item));
    await fetch(`/api/todos/${todo._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed: !todo.completed }) });
  }

  async function deleteTodo(id: string) {
    setTodos((current) => current.filter((todo) => todo._id !== id));
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); setTodos([]); }

  if (loading) return <main className="loading-screen"><span className="spinner" /> Loading your list</main>;
  if (!user) return <main className="auth-shell"><section className="auth-aside"><p className="eyebrow">A quieter way to get things done</p><h1>Make room for what matters.</h1><p className="aside-copy">Keep the small promises to yourself visible, simple, and moving forward.</p><div className="aside-mark">◎</div></section><section className="auth-panel"><div className="brand"><span className="brand-dot" /> daymark</div><div className="auth-content"><p className="eyebrow">{mode === "login" ? "Welcome back" : "Start fresh"}</p><h2>{mode === "login" ? "Your day, in view." : "Build a clearer day."}</h2><p className="muted">{mode === "login" ? "Sign in to pick up where you left off." : "Create an account to keep your list synced."}</p><form onSubmit={submitAuth}>{mode === "register" && <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>}<label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label><label>Password<input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="8+ characters" /></label>{error && <p className="error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</button></form><button className="text-button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Need an account? Create one" : "Already have an account? Sign in"}</button></div><p className="footer-note">Private by design · Your list belongs to you</p></section></main>;

  return <main className="app-shell"><header className="topbar"><div className="brand"><span className="brand-dot" /> daymark</div><div className="profile"><span className="avatar">{user.name.charAt(0).toUpperCase()}</span><span className="profile-name">{user.name}</span><button className="text-button" onClick={logout}>Sign out</button></div></header><section className="workspace"><div className="welcome-row"><div><p className="eyebrow">Your personal workspace</p><h1>Good to see you, {user.name.split(" ")[0]}.</h1></div><div className="date-stamp">{new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</div></div><form className="todo-entry" onSubmit={addTodo}><span className="plus">+</span><input value={newTodo} onChange={(event) => setNewTodo(event.target.value)} placeholder="What needs your attention?" /><button aria-label="Add todo">Add task</button></form><div className="list-header"><div><span className="count">{remaining}</span><span className="muted"> {remaining === 1 ? "thing" : "things"} left to do</span></div><nav className="filters">{(["all", "active", "done"] as const).map((item) => <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>{item}</button>)}</nav></div><div className="todo-list">{visibleTodos.length === 0 ? <div className="empty-state"><span>✦</span><h3>{todos.length === 0 ? "A clean slate." : "Nothing here."}</h3><p>{todos.length === 0 ? "Add your first task above and let the day take shape." : "Try another view to see more of your list."}</p></div> : visibleTodos.map((todo) => <article className={`todo-item ${todo.completed ? "is-done" : ""}`} key={todo._id}><button className="check" aria-label={todo.completed ? "Mark incomplete" : "Mark complete"} onClick={() => toggleTodo(todo)}>{todo.completed ? "✓" : ""}</button><span className="todo-title">{todo.title}</span><button className="delete-button" aria-label="Delete todo" onClick={() => deleteTodo(todo._id)}>×</button></article>)}</div></section><footer className="app-footer"><span>daymark</span><span>Small steps, kept visible.</span></footer></main>;
}
