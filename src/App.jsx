import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTasks, createTask, toggleTask, deleteTask } from './api.js';
import { PRIORITIES, FILTERS, PRIORITY_META, formatTime, isOverdue, todayStr } from './constants.js';

// ---------------- 统计面板 ----------------
function StatsPanel({ tasks }) {
  const total = tasks.length;
  const done = tasks.filter(t => t.completed).length;
  const undone = total - done;
  const rate = total ? Math.round((done / total) * 100) : 0;
  const items = [
    { label: '任务总数', value: total, color: '#2f6fed' },
    { label: '已完成', value: done, color: '#27ae60' },
    { label: '未完成', value: undone, color: '#f39c12' },
    { label: '完成率', value: rate + '%', color: '#8e44ad' }
  ];
  return (
    <div className="stats-grid">
      {items.map(it => (
        <div className="stat-card" key={it.label}>
          <div className="stat-value" style={{ color: it.color }}>{it.value}</div>
          <div className="stat-label">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------- 添加任务 ----------------
function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('中');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await onAdd({ title: title.trim(), priority, dueDate: dueDate || null });
      setTitle('');
      setDueDate('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="task-form card" onSubmit={submit}>
      <input
        className="input title-input"
        placeholder="输入任务标题，回车快速添加…"
        value={title}
        maxLength={200}
        onChange={e => setTitle(e.target.value)}
      />
      <div className="form-row">
        <select className="input select" value={priority} onChange={e => setPriority(e.target.value)}>
          {PRIORITIES.map(p => (
            <option key={p} value={p}>
              {p === '高' ? '🔴 高优先级' : p === '中' ? '🟡 中优先级' : '🟢 低优先级'}
            </option>
          ))}
        </select>
        <input
          className="input date-input"
          type="date"
          title="截止日期（可选）"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
        <button className="btn primary" type="submit" disabled={busy || !title.trim()}>
          {busy ? '添加中…' : '＋ 添加任务'}
        </button>
      </div>
    </form>
  );
}

// ---------------- 搜索 + 筛选 ----------------
function Toolbar({ keyword, onKeyword, filter, onFilter, counts }) {
  return (
    <div className="toolbar card">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          className="input search-input"
          placeholder="搜索任务标题…"
          value={keyword}
          onChange={e => onKeyword(e.target.value)}
        />
        {keyword && (
          <button className="clear-btn" title="清空" onClick={() => onKeyword('')}>×</button>
        )}
      </div>
      <div className="filters">
        {FILTERS.map(f => (
          <button
            key={f}
            className={'filter-btn' + (filter === f ? ' active' : '')}
            onClick={() => onFilter(f)}
          >
            {f === '全部' ? '全部' : `${f}优先级`}
            {f !== '全部' && counts[f] > 0 && <span className="count"> {counts[f]}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- 单条任务 ----------------
function TaskItem({ task, onToggle, onDelete }) {
  const overdue = isOverdue(task);
  return (
    <li className={'task-item' + (task.completed ? ' done' : '') + (overdue ? ' overdue' : '')}>
      <button
        className="check"
        title={task.completed ? '标记为未完成' : '标记为已完成'}
        onClick={() => onToggle(task)}
        aria-label="切换完成状态"
      >
        {task.completed && (
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff"
               strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      <div className="task-body">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span
            className="badge"
            style={{
              color: PRIORITY_META[task.priority]?.color || '#666',
              background: PRIORITY_META[task.priority]?.bg || '#f2f2f2'
            }}
          >
            {task.priority}优先级
          </span>
          <span className="meta-time">🗓 {formatTime(task.created_at)}</span>
          {task.due_date && (
            <span className={'due' + (overdue ? ' overdue-text' : '')}>
              📅 截止：{task.due_date}
              {overdue && ' · ⚠️ 已逾期'}
            </span>
          )}
        </div>
      </div>

      <button className="del-btn" title="删除任务" onClick={() => onDelete(task)}>🗑</button>
    </li>
  );
}

// ---------------- 主应用 ----------------
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState('全部');
  const [demoMode, setDemoMode] = useState(false);

  const load = useCallback(async () => {
    try {
      const json = await fetchTasks();
      setTasks(json.data || []);
      setDemoMode(!!json.demo);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async ({ title, priority, dueDate }) => {
    const json = await createTask({ title, priority, dueDate });
    setTasks(prev => [json.data, ...prev]);
  };

  const handleToggle = async (task) => {
    // 先乐观更新，失败再回滚
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
    try {
      await toggleTask(task.id, !task.completed);
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t));
      alert('更新失败：' + err.message);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`确定删除任务「${task.title}」吗？`)) return;
    setTasks(prev => prev.filter(t => t.id !== task.id));
    try {
      await deleteTask(task.id);
    } catch (err) {
      alert('删除失败：' + err.message);
      load();
    }
  };

  // 搜索 + 筛选（纯前端过滤）
  const visible = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return tasks.filter(t => {
      if (filter !== '全部' && t.priority !== filter) return false;
      if (kw && !t.title.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [tasks, keyword, filter]);

  const counts = useMemo(() => {
    const c = { 高: 0, 中: 0, 低: 0 };
    tasks.forEach(t => { if (!t.completed && c[t.priority] !== undefined) c[t.priority]++; });
    return c;
  }, [tasks]);

  return (
    <div className="page">
      <header className="header">
        <h1>✅ 智能任务管理系统</h1>
        <p>React + Node.js + Supabase · 数据云端存储，换设备不丢失</p>
      </header>

      {demoMode && (
        <div className="demo-banner">
          ⚠️ 本地演示模式：还没配置 Supabase 环境变量，数据暂存在本地文件。
          配置方法见项目 README（SUPABASE_URL / SUPABASE_ANON_KEY）。
        </div>
      )}

      <StatsPanel tasks={tasks} />
      <TaskForm onAdd={handleAdd} />
      <Toolbar
        keyword={keyword} onKeyword={setKeyword}
        filter={filter} onFilter={setFilter}
        counts={counts}
      />

      <div className="list-card card">
        {loading ? (
          <div className="empty">加载中…</div>
        ) : error ? (
          <div className="empty error">加载失败：{error}</div>
        ) : visible.length === 0 ? (
          <div className="empty">
            {tasks.length === 0
              ? '还没有任务，添加一个试试吧 👆'
              : keyword
                ? `没有匹配「${keyword.trim()}」的任务`
                : `没有「${filter}优先级」的任务`}
          </div>
        ) : (
          <ul className="task-list">
            {visible.map(t => (
              <TaskItem key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </ul>
        )}
      </div>

      <footer className="footer">
        智能任务管理系统 · 软件工程实训项目
      </footer>
    </div>
  );
}
