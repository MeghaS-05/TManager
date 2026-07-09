import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:8080/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
  };

  return (
    <div className="app">
      <TopBar token={token} username={username} logout={logout} />
      <div className="content">
        {token ? (
          <TaskBoard token={token} logout={logout} />
        ) : (
          <AuthForm setToken={setToken} setUsername={setUsername} />
        )}
      </div>
    </div>
  );
}

function TopBar({ token, username, logout }) {
  return (
    <div className="topbar">
      <h2>📋 Task Manager</h2>
      {token && (
        <div className="topbar-user">
          <span>Hi, {username}</span>
          <button className="btn-logout" onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  );
}

function AuthForm({ setToken, setUsername }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await axios.post(`${API}/auth/register`, form);
        setIsRegister(false);
        alert('Registered! Now log in.');
      } else {
        const res = await axios.post(`${API}/auth/login`, {
          username: form.username,
          password: form.password
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        setUsername(res.data.username);
        setToken(res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-card">
      <h3>{isRegister ? 'Create an account' : 'Log in'}</h3>
      <form onSubmit={handleSubmit}>
        <input
          className="auth-input"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        {isRegister && (
          <input
            className="auth-input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        )}
        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="btn-primary">
          {isRegister ? 'Register' : 'Login'}
        </button>
      </form>
      <p className="auth-switch">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <a onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Log in' : 'Register'}
        </a>
      </p>
    </div>
  );
}

function TaskBoard({ token, logout }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const loadTasks = async () => {
    try {
      const res = await axios.get(`${API}/tasks`, authHeader);
      setTasks(res.data.content || res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) logout();
    }
  };

  useEffect(() => { loadTasks(); }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await axios.post(`${API}/tasks`, { title, status: 'TODO', dueDate: dueDate || null }, authHeader);
    setTitle('');
    setDueDate('');
    loadTasks();
  };

  const toggleStatus = async (task) => {
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    await axios.put(`${API}/tasks/${task.id}`, { ...task, status: nextStatus }, authHeader);
    loadTasks();
  };

  const deleteTask = async (id) => {
    await axios.delete(`${API}/tasks/${id}`, authHeader);
    loadTasks();
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.dueDate || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDueDate('');
  };

  const saveEdit = async (task) => {
    if (!editTitle.trim()) return;
    await axios.put(
      `${API}/tasks/${task.id}`,
      { ...task, title: editTitle, dueDate: editDueDate || null },
      authHeader
    );
    cancelEdit();
    loadTasks();
  };

 return (
    <div>
      <div className="section-header">
        <h3>Add a new task</h3>
      </div>
      <form onSubmit={addTask} className="task-form">
        <input
          className="task-input"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="task-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <button type="submit" className="btn-add">Add</button>
      </form>

      <div className="section-header section-header-list">
        <h3>Your tasks</h3>
        {tasks.length > 0 && <span className="task-count">{tasks.length}</span>}
      </div>

      {tasks.length === 0 && (
        <p className="empty-state">No tasks yet — add one above.</p>
      )}

      <div className="task-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            {editingId === task.id ? (
              <div className="task-edit-row">
                <input
                  className="task-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                />
                <input
                  className="task-date"
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
                <div className="task-edit-actions">
                  <button className="btn-save" onClick={() => saveEdit(task)}>Save</button>
                  <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="task-left">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    checked={task.status === 'DONE'}
                    onChange={() => toggleStatus(task)}
                  />
                  <div>
                    <div className={`task-title ${task.status === 'DONE' ? 'done' : ''}`}>
                      {task.title}
                    </div>
                    {task.dueDate && <div className="task-due">Due: {task.dueDate}</div>}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn-edit" onClick={() => startEdit(task)}>✎</button>
                  <button className="btn-delete" onClick={() => deleteTask(task.id)}>✕</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;