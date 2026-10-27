import { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_REPORTS } from '../data/dummyData';

const KEY = 'news_dummy_activity';
const Ctx = createContext(null);

const SEED = {
    likes: {
        1: ['reader@news.com', 'neha@news.com', 'sameer@news.com'],
        2: ['reader@news.com'],
        5: ['editor@news.com', 'reader@news.com'],
    },
    saved: {},
    comments: [
        { id: 1, targetId: '1', name: 'Riya', email: 'reader@news.com', text: 'Good to see the exact opening date finally.', date: '2026-10-22' },
        { id: 2, targetId: '1', name: 'Neha Kulkarni', email: 'neha@news.com', text: 'The eight minute gap will help office goers a lot.', date: '2026-10-23' },
        { id: 3, targetId: '2', name: 'Sameer Deshmukh', email: 'sameer@news.com', text: 'What a finish! See you at the final.', date: '2026-10-22' },
        { id: 4, targetId: 'live-1', name: 'Riya', email: 'reader@news.com', text: 'Audio is clear on my side.', date: '2026-10-23' },
    ],
    feedback: [
        { id: 1, name: 'Riya', email: 'reader@news.com', rating: 5, message: 'Clean layout and easy to read on my phone.', date: '2026-10-21' },
    ],
    reports: INITIAL_REPORTS,
};

const today = () => new Date().toISOString().slice(0, 10);

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        if (!saved || typeof saved !== 'object' || !saved.likes) return SEED;
        return {
            ...SEED,
            ...saved,
            reports: Array.isArray(saved.reports) ? saved.reports : SEED.reports,
        };
    } catch {
        return SEED;
    }
}

export function ActivityProvider({ children }) {
    const [data, setData] = useState(load);

    useEffect(() => {
        localStorage.setItem(KEY, JSON.stringify(data));
    }, [data]);

    const toggleIn = (field, id, email) =>
        setData((prev) => {
            const key = String(id);
            const list = prev[field][key] || [];
            const next = list.includes(email) ? list.filter((e) => e !== email) : [...list, email];
            return { ...prev, [field]: { ...prev[field], [key]: next } };
        });

    const addComment = (targetId, user, text) =>
        setData((prev) => ({
            ...prev,
            comments: [
                ...prev.comments,
                {
                    id: Math.max(0, ...prev.comments.map((c) => c.id)) + 1,
                    targetId: String(targetId),
                    name: user.name,
                    email: user.email,
                    text,
                    date: today(),
                },
            ],
        }));

    const deleteComment = (id) =>
        setData((prev) => ({ ...prev, comments: prev.comments.filter((c) => c.id !== id) }));

    const addFeedback = ({ user, rating, message }) =>
        setData((prev) => ({
            ...prev,
            feedback: [
                {
                    id: Math.max(0, ...prev.feedback.map((f) => f.id)) + 1,
                    name: user.name,
                    email: user.email,
                    rating,
                    message,
                    date: today(),
                },
                ...prev.feedback,
            ],
        }));

    const addReport = (report) =>
        setData((prev) => ({
            ...prev,
            reports: [
                {
                    ...report,
                    id: Math.max(0, ...prev.reports.map((item) => item.id)) + 1,
                    status: 'open',
                    date: today(),
                },
                ...prev.reports,
            ],
        }));

    const updateReport = (id, status) =>
        setData((prev) => ({
            ...prev,
            reports: prev.reports.map((report) =>
                report.id === id ? { ...report, status } : report
            ),
        }));

    const resetActivity = () => setData(SEED);

    const value = {
        likes: data.likes,
        saved: data.saved,
        comments: data.comments,
        feedback: data.feedback,
        reports: data.reports,
        toggleLike: (id, email) => toggleIn('likes', id, email),
        toggleSave: (id, email) => toggleIn('saved', id, email),
        addComment,
        deleteComment,
        addFeedback,
        addReport,
        updateReport,
        resetActivity,
    };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useActivity() {
    return useContext(Ctx);
}