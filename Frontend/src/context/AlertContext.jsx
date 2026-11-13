import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import '../style/AlertBox.css';

const Ctx = createContext({ showAlert: () => {} });

const svg = (children) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);

const ICONS = {
    add: svg(<><circle cx="9" cy="8" r="4" /><path d="M2 21v-1a6 6 0 0 1 6-6h2" /><path d="M18 14v6M15 17h6" /></>),
    remove: svg(<><circle cx="9" cy="8" r="4" /><path d="M2 21v-1a6 6 0 0 1 6-6h2" /><path d="M15 17h6" /></>),
    article: svg(<><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" /><path d="M9 9h6M9 13h6" /></>),
    bell: svg(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>),
};

const KINDS = {
    user_added:        { title: 'New user added',    tone: 'green', icon: 'add' },
    user_removed:      { title: 'User removed',      tone: 'red',   icon: 'remove' },
    article_published: { title: 'Article published', tone: 'blue',  icon: 'article' },
    success:           { title: 'Done',              tone: 'green', icon: 'bell' },
    danger:            { title: 'Alert',             tone: 'red',   icon: 'bell' },
    info:              { title: 'Update',            tone: 'blue',  icon: 'bell' },
};

function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 45) return 'now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${Math.max(m, 1)}m ago`;
    return `${Math.floor(m / 60)}h ago`;
}

function Banner({ alert, onClose }) {
    const kind = KINDS[alert.kind] || KINDS.info;
    const [dx, setDx] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [, setTick] = useState(0);
    const startX = useRef(null);
    const moved = useRef(false);

    const close = (dir = 0) => {
        if (leaving) return;
        setLeaving(true);
        setDragging(false);
        if (dir) setDx(dir * 420); // swipe ki taraf ud jaye
        setTimeout(onClose, 230);
    };
    const closeRef = useRef(close);
    closeRef.current = close;


    useEffect(() => {
        if (!alert.duration) return undefined;
        const t = setTimeout(() => closeRef.current(), alert.duration);
        return () => clearTimeout(t);
    }, [alert.duration]);

    // "now" -> "1m ago" update karne ke liye
    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), 30000);
        return () => clearInterval(t);
    }, []);

    const onPointerDown = (e) => {
        startX.current = e.clientX;
        moved.current = false;
        setDragging(true);
        e.currentTarget.setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e) => {
        if (startX.current === null) return;
        const d = e.clientX - startX.current;
        if (Math.abs(d) > 6) moved.current = true;
        setDx(d);
    };
    const onPointerUp = () => {
        if (startX.current === null) return;
        startX.current = null;
        setDragging(false);
        if (Math.abs(dx) > 90) close(dx > 0 ? 1 : -1);
        else setDx(0);
    };

    const style = dx !== 0
        ? { transform: `translateX(${dx}px)`, opacity: leaving ? 0 : Math.max(0.35, 1 - Math.abs(dx) / 300) }
        : undefined;

    const cls = ['notif', dragging && 'notif--dragging', leaving && 'notif--leaving', leaving && dx !== 0 && 'notif--swiped']
        .filter(Boolean).join(' ');

    return (
        <div
            className={cls}
            style={style}
            role={alert.kind === 'user_removed' || alert.kind === 'danger' ? 'alert' : 'status'}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onClick={() => { if (!moved.current) close(); }}
            onKeyDown={(e) => {
                if (['Escape', 'Delete', 'Backspace', 'Enter'].includes(e.key)) close();
            }}
        >
            <div className={`notif__icon notif__icon--${kind.tone}`}>{ICONS[kind.icon]}</div>
            <div className="notif__body">
                <div className="notif__head">
                    <span>NewsApp</span>
                    <span>{timeAgo(alert.createdAt)}</span>
                </div>
                <strong className="notif__title">{kind.title}</strong>
                
                <p className="notif__text">{alert.message}</p>
            </div>
        </div>
    );
}

export function AlertProvider({ children }) {
    const [alerts, setAlerts] = useState([]);
    const counter = useRef(0);

    const dismiss = useCallback((id) => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
    }, []);

    // kind: 'user_added' | 'user_removed' | 'article_published' | 'success' | 'danger' | 'info'
    const showAlert = useCallback((message, kind = 'info', duration = 6000) => {
        counter.current += 1;
        const id = counter.current;
        setAlerts((prev) => [...prev.slice(-2), { id, message, kind, duration, createdAt: Date.now() }]); // max 3
        try { navigator.vibrate?.(80); } catch { /* ignore */ }
    }, []);

    // Dev me console se test karne ke liye: testAlert('user_added')
    useEffect(() => {
        if (!import.meta.env.DEV) return undefined;
        const samples = {
            user_added: 'Riya Sharma ne editor ke roop me join kiya',
            user_removed: 'Neha Verma ko journalist se remove kiya gaya',
            article_published: 'Naya article publish hua: Budget 2026 highlights',
        };
        window.testAlert = (kind = 'user_added', msg) => showAlert(msg || samples[kind] || 'Test alert', kind);
        return () => { delete window.testAlert; };
    }, [showAlert]);

    return (
        <Ctx.Provider value={{ showAlert }}>
            {children}
            <div className="notif-stack" aria-live="polite" aria-label="Notifications">
                {alerts.map((a) => (
                    <Banner key={a.id} alert={a} onClose={() => dismiss(a.id)} />
                ))}
            </div>
        </Ctx.Provider>
    );
}

export function useAlert() {
    return useContext(Ctx);
}