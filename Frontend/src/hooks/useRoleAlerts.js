import { useEffect, useRef } from 'react';
import { useAlert } from '../context/AlertContext';
import { getNotifications } from '../services/notificationService';

const POLL_MS = 15000;
const SEEN_KEY = 'news_seen_alerts';


function loadSeen() {
    try {
        return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)) || []);
    } catch {
        return new Set();
    }
}

function saveSeen(set) {
    try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...set].slice(-200)));
    } catch {
        /* storage full / blocked - ignore */
    }
}

// Sirf admin aur publisher ke liye alerts.
export default function useRoleAlerts(session) {
    const { showAlert } = useAlert();
    const role = session?.user?.role;
    const enabled = role === 'admin' || role === 'publisher';
    const userId = session?.user?.id;
    const showRef = useRef(showAlert);
    showRef.current = showAlert;

    useEffect(() => {
        if (!enabled) return undefined;

        const seen = loadSeen();
        // Purane events ka spam nahi: sirf ab ke baad ke dikhao
        let since = new Date().toISOString();
        let stopped = false;

        const tick = async () => {
            if (document.hidden) return;
            try {
                const list = await getNotifications(since);
                if (stopped) return;
                const fresh = list
                    .filter((n) => n._id && !seen.has(n._id))
                    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

                fresh.forEach((n) => {
                    seen.add(n._id);
                    showRef.current(n.message, n.type);
                    if (n.createdAt && n.createdAt > since) since = n.createdAt;
                });
                if (fresh.length) saveSeen(seen);
            } catch {
                // backend band / network error: agle tick me dobara try
            }
        };

        const timer = setInterval(tick, POLL_MS);
        const onVisible = () => !document.hidden && tick();
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            stopped = true;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [enabled, userId]);
}