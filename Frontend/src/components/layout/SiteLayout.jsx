import { Link, NavLink } from 'react-router-dom';
import { useArticles } from '../../context/ArticlesContext';
import { useActivity } from '../../context/ActivityContext';
import { ROLE_LABELS, HOME_BY_ROLE } from '../../data/roles';
// import '../../style/site.css';

const linkClass = ({ isActive }) => `s-link${isActive ? ' is-active' : ''}`;

export default function SiteLayout({ session, onLogout, children }) {
    const user = session?.user;
    const { articles } = useArticles();
    const { saved } = useActivity();

    const bookmarkCount = user
        ? articles.filter(
            (a) => a.status === 'published' && (saved[String(a.id)] || []).includes(user.email)
        ).length
        : 0;

    const isStaff = user && user.role !== 'reader';
    const workspaceLabel = user?.role === 'journalist' ? 'Publisher' : 'Dashboard';

    return (
        <div className="site">
            <header className="s-nav">
                <div className="s-nav__inner">
                    <Link to="/" className="s-brand">News Platform</Link>

                    <nav className="s-links" aria-label="Main">
                        <NavLink to="/" end className={linkClass}>News</NavLink>
                        <NavLink to="/live" className={linkClass}>Live</NavLink>
                        {user && (
                            <NavLink to="/bookmarks" className={linkClass}>
                                Bookmarks
                                {bookmarkCount > 0 && <span className="s-count">{bookmarkCount}</span>}
                            </NavLink>
                        )}
                        {user && <NavLink to="/feedback" className={linkClass}>Feedback</NavLink>}
                        {isStaff && (
                            <NavLink to={HOME_BY_ROLE[user.role]} className={linkClass}>
                                {workspaceLabel}
                            </NavLink>
                        )}
                    </nav>

                    <div className="s-account">
                        {user ? (
                            <>
                                <span className="s-name">{user.name}</span>
                                <span className="s-role">{ROLE_LABELS[user.role]}</span>
                                <button type="button" className="s-btn" onClick={onLogout}>Log out</button>
                            </>
                        ) : (
                            <Link to="/login" className="s-btn s-btn--solid">Sign in</Link>
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