import '../../style/DashboardLayout.css';
import { Link } from 'react-router-dom';

const ROLE_HINTS = {
    reader: 'Browse the latest stories, all reviewed by our editors.',
    journalist: 'Write stories, save drafts and send them to an editor.',
    editor: 'Read submitted stories and decide what gets published.',
    admin: 'Manage users, handle reports and keep the platform healthy.',
};

const todayLabel = () =>
    new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

export default function DashboardLayout({ session, onLogout, title, subtitle, children }) {
    const { name, role } = session.user;

    return (
        <div className="dash">
            <header className="dash__bar">
                <div className="dash__bar-inner">
                    <span className="dash__brand">News Platform</span>
                    <div className="dash__user">
                        <span>{name}</span>
                        <span className="dash__role">{role}</span>
                        <Link to="/" className="dbtn">View site</Link>
                        <Link to="/login" className="dbtn" onClick={onLogout}>
                            Log out
                        </Link>
                    </div>
                </div>
            </header>

            <section className="dash__hero">
                <div className="dash__hero-inner">
                    <p className="dash__eyebrow">Welcome back, {name}</p>
                    <h1>{title}</h1>
                    <p className="dash__sub">{subtitle}</p>
                    <p className="dash__hint">
                        <span className="dash__chip">{role}</span>
                        <span>{ROLE_HINTS[role] || ROLE_HINTS.reader}</span>
                        <span className="dash__date">{todayLabel()}</span>
                    </p>
                </div>
            </section>

            <main className="dash__main">{children}</main>

            <footer className="dash__foot">
                <p>News Platform dashboard. Every story is reviewed by an editor before it is published.</p>
            </footer>
        </div>
    );
}