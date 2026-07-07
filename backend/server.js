const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./planner.sqlite', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

function run(schema) {
  return new Promise((resolve, reject) => {
    db.run(schema, (err) => (err ? reject(err) : resolve()));
  });
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'Medium',
      completed INTEGER DEFAULT 0,
      due_date TEXT,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      members TEXT DEFAULT '[]',
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      percent INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      read_flag INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  const seed = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => (err ? reject(err) : resolve(row.count)));
  });

  if (seed === 0) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await run(`
      INSERT INTO users (name, email, password, role) VALUES
      ('Ava', 'ava@example.com', '${hashedPassword}', 'admin')
    `);
  }
}

initDb().catch((error) => console.error(error));

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

app.post('/api/register', async (req, res) => {
  const { name, email, password, role = 'student' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashed, role],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
    const token = jwt.sign({ id: result, email, role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: result, name, email, role } });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => (err ? reject(err) : resolve(row)));
  });

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/me', authenticateToken, async (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, role: req.user.role } });
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
  res.json(rows);
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description, priority, dueDate } = req.body;
  const result = await new Promise((resolve, reject) => {
    db.run('INSERT INTO tasks (title, description, priority, due_date, user_id) VALUES (?, ?, ?, ?, ?)', [title, description, priority, dueDate, req.user.id], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
  res.json({ id: result, title, description, priority, dueDate, completed: 0 });
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { title, description, priority, dueDate, completed } = req.body;
  await new Promise((resolve, reject) => {
    db.run('UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, completed = ? WHERE id = ? AND user_id = ?', [title, description, priority, dueDate, completed ? 1 : 0, req.params.id, req.user.id], (err) => (err ? reject(err) : resolve()));
  });
  res.json({ ok: true });
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err) => (err ? reject(err) : resolve()));
  });
  res.json({ ok: true });
});

app.get('/api/notes', authenticateToken, async (req, res) => {
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
  res.json(rows);
});

app.post('/api/notes', authenticateToken, async (req, res) => {
  const { title, content, category } = req.body;
  const result = await new Promise((resolve, reject) => {
    db.run('INSERT INTO notes (title, content, category, user_id) VALUES (?, ?, ?, ?)', [title, content, category, req.user.id], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
  res.json({ id: result, title, content, category });
});

app.get('/api/groups', authenticateToken, async (req, res) => {
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM groups WHERE owner_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
  res.json(rows);
});

app.post('/api/groups', authenticateToken, async (req, res) => {
  const { name, subject } = req.body;
  const result = await new Promise((resolve, reject) => {
    db.run('INSERT INTO groups (name, subject, owner_id) VALUES (?, ?, ?)', [name, subject, req.user.id], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
  res.json({ id: result, name, subject, members: [] });
});

app.get('/api/progress', authenticateToken, async (req, res) => {
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM progress WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
  res.json(rows);
});

app.post('/api/progress', authenticateToken, async (req, res) => {
  const { topic, percent } = req.body;
  const result = await new Promise((resolve, reject) => {
    db.run('INSERT INTO progress (user_id, topic, percent) VALUES (?, ?, ?)', [req.user.id, topic, percent], function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
  res.json({ id: result, topic, percent });
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  const rows = await new Promise((resolve, reject) => {
    db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => (err ? reject(err) : resolve(rows)));
  });
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
