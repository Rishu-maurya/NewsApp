import { Link, NavLink } from 'react-router-dom';
import { useArticles } from '../../context/ArticlesContext';
import { useActivity } from '../../context/ActivityContext';
<<<<<<< Updated upstream
import { isLive } from '../../utils/dateUtils';
=======
import { useProfiles } from '../../context/ProfileContext';
import { isLive } from '../../utils/dateUtils';
import Avatar from '../profile/Avtar';
>>>>>>> Stashed changes
import NavDateFilter from './NavDateFilter';
import '../../style/site.css';

const STAFF = ['journalist', 'editor', 'admin'];
const linkClass = ({ isActive }) => `s-link${isActive ? ' is-active' : ''}`;

export default function SiteLayout({ session, onLogout, children }) {
    const user = session?.user;
    const { articles } = useArticles();
    const { saved } = useActivity();
<<<<<<< Updated upstream
=======
    const { profiles } = useProfiles();

    const me = user ? profiles[user.email] || { name: user.name, photo: '' } : null;
>>>>>>> Stashed changes

    const bookmarkCount = user
        ? articles.filter(
            (a) => isLive(a) && (saved[String(a.id)] || []).includes(user.email)
        ).length
        : 0;

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
                        {user && STAFF.includes(user.role) && (
                            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                        )}
                    </nav>

                    <NavDateFilter />

                    <div className="s-account">
                        {user ? (
                            <>
                                <Link to="/profile" className="s-me" aria-label="Open my profile">
                                    <Avatar profile={me} size={34} />
                                    <span className="s-name">{me.name}</span>
                                </Link>
                                <button type="button" className="s-btn" onClick={onLogout}>Log out</button>
                            </>
                        ) : (
                            <Link to="/login" className="s-btn s-btn--solid">Sign in</Link>
                        )}
                    </div>
                </div>

                <div className="s-nav__row">
                    <NavDateFilter />
                </div>
            </header>

            <main className="s-main">{children}</main>

            <footer className="s-footer">
                <p>News Platform. Every story is reviewed by an editor before it is published.</p>
            </footer>
        </div>
    );
}