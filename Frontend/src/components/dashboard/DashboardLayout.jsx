import './dashboard.css';
import { Link } from 'react-router-dom';

export default function DashboardLayout({ session, onLogout, title, subtitle, children }) {
    return (
        <div className="dash">
            <header className="dash__bar">
                <div className="dash__bar-inner">
                    <span className="dash__brand">News Platform</span>
                    <div className="dash__user">
                        <span>{session.user.name}</span>
                        <span className="dash__role">{session.user.role}</span>
                        <Link to="/" className="dbtn">View site</Link>
                        <Link to="/login" className="dbtn" onClick={onLogout}>
                            Log out
                        </Link>
                    </div>
                </div>
            </header>

            <main className="dash__main">
                <h1>{title}</h1>
                <p className="dash__sub">{subtitle}</p>
                {children}
            </main>
        </div>
    );
}