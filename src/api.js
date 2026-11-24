// 前端统一调用后端接口的封装

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.message || `请求失败（${res.status}）`);
  }
  return json;
}

export function fetchTasks() {
  return request('/api/tasks');
}

export function createTask({ title, priority, dueDate }) {
  return request('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, priority, dueDate })
  });
}

export function toggleTask(id, completed) {
  return request(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed })
  });
}

export function deleteTask(id) {
  return request(`/api/tasks/${id}`, { method: 'DELETE' });
}
