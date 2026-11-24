// ============================================================
// 智能任务管理系统 —— Node.js 后端
// 有 Supabase 环境变量时：数据存云端数据库（正式模式）
// 没有时：降级为本地 JSON 文件存储（演示模式），页面顶部会有黄条提示
// ============================================================

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ------------------------------------------------------------
// 极简 .env 加载器（本地开发用；Vercel 上直接用环境变量面板，不读 .env）
// ------------------------------------------------------------
try {
  const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* 没有 .env 文件就跳过 */ }

app.use(express.json());

// ------------------------------------------------------------
// Supabase 配置（Vercel 环境变量：SUPABASE_URL / SUPABASE_ANON_KEY）
// ------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

const CONFIGURED = /^https:\/\/.+\.supabase\.(co|in)$/.test(SUPABASE_URL) && SUPABASE_KEY.length > 20;
const supabase = CONFIGURED ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// ------------------------------------------------------------
// 本地演示存储（未配置 Supabase 时使用）
// ------------------------------------------------------------
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

function localRead() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function localWrite(list) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

// 统一的任务格式
function normalize(row) {
  return {
    id: row.id,
    title: row.title,
    priority: row.priority,
    completed: !!row.completed,
    due_date: row.due_date || null,
    created_at: row.created_at
  };
}

// ------------------------------------------------------------
// 接口：查询（最新任务排最上面）
// GET /api/tasks
// ------------------------------------------------------------
app.get('/api/tasks', async (req, res) => {
  try {
    if (CONFIGURED) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json({ success: true, demo: false, data: (data || []).map(normalize) });
    }
    // 演示模式：本地文件，同样按创建时间倒序
    const list = localRead().sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    res.json({ success: true, demo: true, data: list.map(normalize) });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询失败：' + err.message });
  }
});

// ------------------------------------------------------------
// 接口：新增任务
// POST /api/tasks  body: { title, priority, dueDate }
// ------------------------------------------------------------
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: '任务标题不能为空' });
    }
    const prio = ['高', '中', '低'].includes(priority) ? priority : '中';
    const row = {
      title: String(title).trim(),
      priority: prio,
      completed: false,
      due_date: dueDate || null,
      created_at: new Date().toISOString()
    };

    if (CONFIGURED) {
      const { data, error } = await supabase.from('tasks').insert([row]).select();
      if (error) throw error;
      return res.json({ success: true, demo: false, data: normalize(data[0]) });
    }
    row.id = 'local-' + Date.now();
    const list = localRead();
    list.push(row);
    localWrite(list);
    res.json({ success: true, demo: true, data: normalize(row) });
  } catch (err) {
    res.status(500).json({ success: false, message: '添加失败：' + err.message });
  }
});

// ------------------------------------------------------------
// 接口：切换完成状态
// PATCH /api/tasks/:id  body: { completed }
// ------------------------------------------------------------
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { completed } = req.body || {};
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ success: false, message: '参数 completed 必须是 true/false' });
    }
    if (CONFIGURED) {
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', req.params.id)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ success: false, message: '任务不存在' });
      }
      return res.json({ success: true, demo: false, data: normalize(data[0]) });
    }
    const list = localRead();
    const idx = list.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: '任务不存在' });
    list[idx].completed = completed;
    localWrite(list);
    res.json({ success: true, demo: true, data: normalize(list[idx]) });
  } catch (err) {
    res.status(500).json({ success: false, message: '更新失败：' + err.message });
  }
});

// ------------------------------------------------------------
// 接口：删除任务
// DELETE /api/tasks/:id
// ------------------------------------------------------------
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    if (CONFIGURED) {
      const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
      if (error) throw error;
      return res.json({ success: true, demo: false });
    }
    const list = localRead().filter(t => t.id !== req.params.id);
    localWrite(list);
    res.json({ success: true, demo: true });
  } catch (err) {
    res.status(500).json({ success: false, message: '删除失败：' + err.message });
  }
});

// ------------------------------------------------------------
// 健康检查
// ------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    configured: CONFIGURED,
    demo: !CONFIGURED,
    supabaseUrl: CONFIGURED ? SUPABASE_URL : null
  });
});

// ------------------------------------------------------------
// 生产环境：托管 Vite 构建产物 dist/
// ------------------------------------------------------------
const DIST = path.join(__dirname, 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 智能任务管理系统已启动：http://localhost:${PORT}`);
  console.log(CONFIGURED
    ? `🔗 已连接 Supabase 云端数据库：${SUPABASE_URL}`
    : '⚠️  未配置 Supabase（本地演示模式），数据保存在 data/tasks.json');
});
