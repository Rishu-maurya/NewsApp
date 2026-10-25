export const pad = (n) => String(n).padStart(2, '0');

export const toDateStr = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => toDateStr(new Date());

export const shiftDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return toDateStr(d);
};

export const WEEKDAYS = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export const dayName = (dateStr) => WEEKDAYS[new Date(`${dateStr}T00:00:00`).getDay()];

export const formatTime = (stamp) =>
    new Date(stamp).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export const DEFAULT_WHEN = { range: 'all', date: '', weekday: 'any' };

export function matchesDate(dateStr, { range, date, weekday }) {
    if (weekday !== 'any' && dayName(dateStr) !== weekday) return false;
    if (range === 'today') return dateStr === todayStr();
    if (range === 'yesterday') return dateStr === shiftDays(-1);
    if (range === 'week') return dateStr >= shiftDays(-6) && dateStr <= todayStr();
    if (range === 'date') return !date || dateStr === date;
    return true;
}

export const isLive = (a) => {
    if (a.status !== 'published') return false;
    if (!a.publishDate) return true;
    return new Date(`${a.publishDate}T${a.publishTime || '00:00'}`) <= new Date();
};