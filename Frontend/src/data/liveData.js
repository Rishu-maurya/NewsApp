import { dayName, formatTime, pad, toDateStr } from '../utils/dateUtils';

const stamp = (offsetMinutes) => {
    const d = new Date(Date.now() + offsetMinutes * 60000);
    return `${toDateStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const LIVE_STREAMS = [
    {
        id: 'live-1',
        title: 'City council meeting: live coverage',
        channel: 'News Platform Live',
        category: 'City',
        viewers: 1240,
        description: 'Follow the council discussion on the new water supply plan.',
        startsAt: stamp(-30),
        durationMin: 120,
        embedUrl: '',
    },
    {
        id: 'live-2',
        title: 'State final: pre-match show',
        channel: 'Sports Desk',
        category: 'Sports',
        viewers: 860,
        description: 'Team news and expert views before the final.',
        startsAt: stamp(24 * 60),
        durationMin: 60,
        embedUrl: '',
    },
    {
        id: 'live-3',
        title: 'Tech talk: AI in classrooms',
        channel: 'Tech Desk',
        category: 'Tech',
        viewers: 430,
        description: 'Teachers and students discuss the new AI lab courses.',
        startsAt: stamp(48 * 60),
        durationMin: 45,
        embedUrl: '',
    },
];

export function getStatus(stream) {
    const start = new Date(stream.startsAt).getTime();
    const end = start + stream.durationMin * 60000;
    const now = Date.now();
    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'live';
}

export const startLabel = (s) => {
    const date = s.startsAt.slice(0, 10);
    return `${dayName(date)}, ${date} · ${formatTime(s.startsAt)}`;
};