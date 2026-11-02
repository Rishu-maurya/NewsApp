import { Link, NavLink } from 'react-router-dom';
import '../../style/dashboard.css';
import './publisher.css';

const linkClass = ({ isActive }) => `pub-link${isActive ? ' is-active' : ''}`;

export default function PublisherLayout({ session, onLogout, title, subtitle, children }) {
    return (
        <div className="dash">
            <header className="dash__bar">
                <div className="dash__bar-inner">
                    <span className="dash__brand">News Platform</span>
                    <div className="dash__user">
                        <span>{session.user.name}</span>
                        <span className="dash__role">Publisher</span>
                        <Link to="/" className="dbtn">View site</Link>
                        <button type="button" className="dbtn" onClick={onLogout}>Log out</button>
                    </div>
                </div>
            </header>

            <div className="pub">
                <aside className="pub__side">
                    <nav aria-label="Publisher menu">
                        <NavLink to="/publisher" end className={linkClass}>Overview</NavLink>
                        <NavLink to="/publisher/write" className={linkClass}>Write story</NavLink>
                        <NavLink to="/publisher/stories" className={linkClass}>My stories</NavLink>
                    </nav>
                </aside>

                <main className="pub__main">
                    <h1>{title}</h1>
                    <p className="dash__sub">{subtitle}</p>
                    {children}
                </main>
            </div>
        </div>
    );
}