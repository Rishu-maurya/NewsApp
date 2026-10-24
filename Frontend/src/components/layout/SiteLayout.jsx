import { Link, NavLink } from 'react-router-dom';
import '../../style/site.css';

const STAFF = ['journalist', 'editor', 'admin'];
const linkClass = ({ isActive }) => `s-link${isActive ? ' is-active' : ''}`;

export default function SiteLayout({ session, onLogout, children }) {
    const user = session?.user;

    return (
        <div className="site">
            <header className="s-nav">
                <div className="s-nav__inner">
                    <Link to="/" className="s-brand">News Platform</Link>

                    <nav className="s-links" aria-label="Main">
                        <NavLink to="/" end className={linkClass}>News</NavLink>
                        <NavLink to="/live" className={linkClass}>Live</NavLink>
                        {user && <NavLink to="/feedback" className={linkClass}>Feedback</NavLink>}
                        {user && STAFF.includes(user.role) && (
                            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                        )}
                    </nav>

                    <div className="s-account">
                        {user ? (
                            <>
                                <span className="s-name">{user.name}</span>
                                <button type="button" className="s-btn" onClick={onLogout}>Log out</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="s-link">Log in</Link>
                                <Link to="/register" className="s-btn s-btn--solid">Create account</Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="s-main">{children}</main>

            <footer className="s-footer">
                <p>News Platform. Every story is reviewed by an editor before it is published.</p>
            </footer>
        </div>
    );
}