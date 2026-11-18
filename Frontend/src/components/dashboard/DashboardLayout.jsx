import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../style/DashboardLayout.css';

const ROLE_HINTS = {
    reader: 'Browse the latest stories, all reviewed by our editors.',
    journalist: 'Write stories, save drafts and send them to an editor.',
    editor: 'Read submitted stories and decide what gets published.',
    publisher: 'Verify role requests and keep your stories moving.',
    admin: 'Manage users, handle reports and keep the platform healthy.',
};

const todayLabel = () =>
    new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const greeting = (d) => {
    const h = d.getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

function HeroClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    const hh = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }).split(':');
    return (
        <aside className="dash__clock" aria-label="Current time">
            <span className="dash__live"><i /> Newsroom live</span>
            <p className="dash__time" aria-hidden="true">
                {hh[0]}<b>:</b>{hh[1]}
                <small>{String(now.getSeconds()).padStart(2, '0')}</small>
            </p>
            <p className="dash__greet">{greeting(now)}</p>
        </aside>
    );
}

export default function DashboardLayout({ session, title, subtitle, side, children }) {
    const { name, role } = session.user;

    return (
        <div className="dash">
            <header className="dash__bar">
                <div className="dash__bar-inner">
                    <span className="dash__brand">News Platform</span>
                    <div className="dash__user">
                        <Link
                            to="/profile"
                            className="dash__profile"
                            title="Open your profile"
                            aria-label={`${name}, open your profile`}
                        >
                            <span className="dash__avatar" aria-hidden="true">{name.trim().charAt(0).toUpperCase()}</span>
                            <span className="dash__name">{name}</span>
                            <span className="dash__role">{role}</span>
                        </Link>
                    </div>
                </div>
            </header>

            <section className="dash__hero">
                <div className="dash__hero-inner">
                    <div className="dash__hero-text">
                        <p className="dash__eyebrow">Welcome back, {name}</p>
                        <h1>{title}</h1>
                        <p className="dash__sub">{subtitle}</p>
                        <p className="dash__hint">
                            <span className="dash__chip">{role}</span>
                            <span>{ROLE_HINTS[role] || ROLE_HINTS.reader}</span>
                            <span className="dash__date">{todayLabel()}</span>
                        </p>
                    </div>
                    <HeroClock />
                </div>
            </section>

            <div className={`dash__grid${side ? ' dash__grid--split' : ''}`}>
                <main className="dash__main">{children}</main>
                {side && <aside className="dash__side" aria-label="Overview and shortcuts">{side}</aside>}
            </div>

            <footer className="dash__foot">
                <p>News Platform dashboard. Every story is reviewed by an editor before it is published.</p>
            </footer>
        </div>
    );
}
