// 全局常量与小工具

export const PRIORITIES = ['高', '中', '低'];

export const PRIORITY_META = {
  高: { color: '#e74c3c', bg: '#fdecea', label: '高优先级' },
  中: { color: '#f39c12', bg: '#fef5e7', label: '中优先级' },
  低: { color: '#27ae60', bg: '#eafaf1', label: '低优先级' }
};

export const FILTERS = ['全部', '高', '中', '低'];

/** 格式化 ISO 时间 -> 2026/11/24 15:30 */
export function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 今天的日期字符串 YYYY-MM-DD（用于逾期判断） */
export function todayStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 截止日期是否已逾期（未完成且截止时间早于今天） */
export function isOverdue(task) {
  if (!task.due_date || task.completed) return false;
  return task.due_date < todayStr();
}

/** 防止 XSS 的文本转义由 React 自动完成，这里只做清洗 */
export function cleanText(s) {
  return String(s || '').trim();
}
