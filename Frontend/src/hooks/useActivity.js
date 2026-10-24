import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EMPTY = { liked: [], saved: [] };

function read(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || EMPTY;
    } catch {
        return EMPTY;
    }
}

export default function useActivity(session) {
    const navigate = useNavigate();
    const key = session ? `news_activity_${session.user.email}` : null;
    const [data, setData] = useState(() => (key ? read(key) : EMPTY));

    useEffect(() => {
        setData(key ? read(key) : EMPTY);
    }, [key]);

    const toggle = (type, id) => {
        if (!key) {
            navigate('/login', { state: { message: 'Log in to like and save articles.' } });
            return;
        }
        setData((prev) => {
            const list = prev[type].includes(id)
                ? prev[type].filter((item) => item !== id)
                : [...prev[type], id];
            const next = { ...prev, [type]: list };
            localStorage.setItem(key, JSON.stringify(next));
            return next;
        });
    };

    return {
        liked: data.liked,
        saved: data.saved,
        toggleLike: (id) => toggle('liked', id),
        toggleSave: (id) => toggle('saved', id),
    };
}