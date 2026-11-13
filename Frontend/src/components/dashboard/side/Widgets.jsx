import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../../style/DashSide.css';

const ICONS = {
    pen: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></>,
    live: <><circle cx="12" cy="12" r="2.5" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 4.9a10 10 0 0 1 0 14.2" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    chat: <><path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-5.5A8 8 0 1 1 21 12z" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    flag: <><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
};

export function Icon({ name, size = 18 }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[name] || ICONS.spark}
        </svg>
    );
}

export function Widget({ title, icon = 'spark', children, className = '' }) {
    return (
        <section className={`sw ${className}`}>
            <header className="sw__head">
                <span className="sw__icon"><Icon name={icon} size={16} /></span>
                <h3 className="sw__title">{title}</h3>
            </header>
            {children}
        </section>
    );
}

// Horizontal bars. rows: [{ label, value, tone }]  tone: blue | red | green | amber | grey
export function BarList({ rows, empty = 'Nothing to show yet.' }) {
    const max = Math.max(1, ...rows.map((r) => r.value));
    if (rows.every((r) => r.value === 0)) return <p className="sw__empty">{empty}</p>;
    return (
        <ul className="bars">
            {rows.map((r, i) => (
                <li key={r.label} className="bars__row" style={{ '--i': i }}>
                    <span className="bars__label">{r.label}</span>
                    <span className="bars__track">
                        <span className={`bars__fill bars__fill--${r.tone || 'blue'}`} style={{ '--w': `${(r.value / max) * 100}%` }} />
                    </span>
                    <span className="bars__value">{r.value}</span>
                </li>
            ))}
        </ul>
    );
}

// Circular progress ring
export function Ring({ value, total, label, sub, tone = 'blue' }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    const C = 2 * Math.PI * 34;
    return (
        <div className="ring">
            <svg viewBox="0 0 80 80" className="ring__svg" role="img" aria-label={`${label}: ${pct}%`}>
                <circle cx="40" cy="40" r="34" className="ring__bg" />
                <circle cx="40" cy="40" r="34" className={`ring__fg ring__fg--${tone}`}
                        style={{ '--C': C, '--off': C - (C * pct) / 100 }} />
            </svg>
            <span className="ring__pct">{pct}<small>%</small></span>
            <div className="ring__text">
                <strong>{label}</strong>
                <span>{sub ?? `${value} of ${total}`}</span>
            </div>
        </div>
    );
}

export function QuickLinks({ links }) {
    return (
        <div className="qlinks">
            {links.map((l, i) => (
                <Link key={l.to} to={l.to} className="qlink" style={{ '--i': i }}>
                    <span className="qlink__icon"><Icon name={l.icon} /></span>
                    <span className="qlink__text"><strong>{l.label}</strong><small>{l.hint}</small></span>
                    <span className="qlink__arrow" aria-hidden="true">&rarr;</span>
                </Link>
            ))}
        </div>
    );
}

// Tick karne wali checklist + progress bar (state sirf is page ke liye)
export function Checklist({ items }) {
    const [done, setDone] = useState({});
    const count = items.filter((_, i) => done[i]).length;
    return (
        <>
            <div className="check__progress" aria-hidden="true">
                <span style={{ width: `${(count / items.length) * 100}%` }} />
            </div>
            <ul className="check">
                {items.map((t, i) => (
                    <li key={t}>
                        <label className={done[i] ? 'is-done' : ''}>
                            <input type="checkbox" checked={!!done[i]} onChange={() => setDone((d) => ({ ...d, [i]: !d[i] }))} />
                            <span className="check__box" aria-hidden="true" />
                            <span>{t}</span>
                        </label>
                    </li>
                ))}
            </ul>
            <p className="sw__foot">{count === items.length ? 'All done. Good to go!' : `${count} of ${items.length} done`}</p>
        </>
    );
}

// Latest items list. items: [{ title, meta, tone }]
export function Feed({ items, empty = 'No activity yet.' }) {
    if (items.length === 0) return <p className="sw__empty">{empty}</p>;
    return (
        <ul className="feed">
            {items.map((it, i) => (
                <li key={`${it.title}-${i}`} className="feed__item" style={{ '--i': i }}>
                    <span className={`feed__dot feed__dot--${it.tone || 'blue'}`} />
                    <div>
                        <p className="feed__title">{it.title}</p>
                        <p className="feed__meta">{it.meta}</p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

// Har 7 sec me badalne wala tip card
export function TipRotator({ tips }) {
    const [i, setI] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setI((n) => (n + 1) % tips.length), 7000);
        return () => clearInterval(t);
    }, [tips.length]);
    return (
        <div className="tip">
            <p key={i} className="tip__text">{tips[i]}</p>
            <div className="tip__dots" aria-hidden="true">
                {tips.map((_, n) => <span key={n} className={n === i ? 'is-on' : ''} />)}
            </div>
        </div>
    );
}

// 3-step pipeline (Draft -> In review -> Published)
export function Steps({ steps }) {
    return (
        <ol className="steps">
            {steps.map((s, i) => (
                <li key={s.label} className="steps__item" style={{ '--i': i }}>
                    <span className="steps__num">{s.value}</span>
                    <span className="steps__label">{s.label}</span>
                </li>
            ))}
        </ol>
    );
}
