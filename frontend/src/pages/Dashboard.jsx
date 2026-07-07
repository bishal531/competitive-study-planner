import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarClock, ClipboardList, Users, Bell, PlusCircle, Search, Sparkles } from 'lucide-react';

const demoTasks = [
  { id: 1, title: 'Solve 20 DSA questions', description: 'Focus on arrays and trees', priority: 'High', dueDate: '2026-07-10', completed: false },
  { id: 2, title: 'Revise chemistry formulas', description: 'Fast recap before mock test', priority: 'Medium', dueDate: '2026-07-08', completed: true },
];

const demoNotes = [
  { id: 1, title: 'Quantum shortcuts', content: 'Remember the trick for energy transitions.', category: 'Physics' },
  { id: 2, title: 'Math formula sheet', content: 'Keep all the derivative rules ready.', category: 'Math' },
];

const demoGroups = [{ id: 1, name: 'Logic Legends', subject: 'DSA' }, { id: 2, name: 'Formula Squad', subject: 'Physics' }];

export default function Dashboard() {
  const [tasks, setTasks] = useState(demoTasks);
  const [notes, setNotes] = useState(demoNotes);
  const [groups] = useState(demoGroups);
  const [query, setQuery] = useState('');
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${apiBaseUrl}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setTasks(data.length ? data : demoTasks));
    fetch(`${apiBaseUrl}/api/notes`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setNotes(data.length ? data : demoNotes));
  }, [apiBaseUrl]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()));
  }, [tasks, query]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Competitive Study Planner</p>
            <h1 className="text-2xl font-semibold">Stay sharp, stay consistent.</h1>
          </div>
          <button className="rounded-full border border-cyan-500/50 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">+ New Session</button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[1.6fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-cyan-500/15 via-slate-900 to-violet-500/10 p-6">
            <div className="flex items-center gap-2 text-cyan-300"><Sparkles size={18} /> AI-powered focus mode</div>
            <h2 className="mt-3 text-3xl font-semibold">Plan your day like a champion.</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Track tasks, notes, study groups, and growth in one calm workspace.</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Today’s tasks</h3>
              <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-300">
                <Search size={14} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks" className="bg-transparent outline-none" />
              </div>
            </div>
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-slate-400">{task.description}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-cyan-300">{task.priority}</p>
                    <p className="text-slate-400">{task.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-3 flex items-center gap-2 text-cyan-300"><ClipboardList size={18} /> Notes</div>
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-2xl bg-slate-950/80 p-3">
                    <p className="font-medium">{note.title}</p>
                    <p className="text-sm text-slate-400">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
              <div className="mb-3 flex items-center gap-2 text-violet-300"><Users size={18} /> Study groups</div>
              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.id} className="rounded-2xl bg-slate-950/80 p-3">
                    <p className="font-medium">{group.name}</p>
                    <p className="text-sm text-slate-400">{group.subject}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-emerald-300"><CalendarClock size={18} /> Weekly rhythm</div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-slate-950/80 p-3">Morning: DSA drills</div>
              <div className="rounded-2xl bg-slate-950/80 p-3">Afternoon: revision blocks</div>
              <div className="rounded-2xl bg-slate-950/80 p-3">Evening: mock test review</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-amber-300"><Bell size={18} /> Reminders</div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li className="rounded-2xl bg-slate-950/80 p-3">3 unread study group invitations</li>
              <li className="rounded-2xl bg-slate-950/80 p-3">Goal checkpoint in 2 days</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-3 flex items-center gap-2 text-fuchsia-300"><BookOpen size={18} /> Focus score</div>
            <div className="text-4xl font-semibold">82%</div>
            <p className="mt-2 text-sm text-slate-400">Steady progress this week</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
