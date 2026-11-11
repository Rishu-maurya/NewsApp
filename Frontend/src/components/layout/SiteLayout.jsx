import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useBookmarks } from '../../context/BookmarksContext';
import NavDateFilter from './NavDateFilter';
import '../../style/SiteLayout.css';
import '../../style/Navbar.css';
import '../../style/SiteTheme.css';

const linkClass = ({ isActive }) => `s-link${isActive ? ' is-active' : ''}`;

export default function SiteLayout({ session, onLogout, children }) {
    const user = session?.user;
    const { ids: serverSaved } = useBookmarks();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const bookmarkCount = user ? serverSaved.size : 0;

    return (
        <div className="site">
            <header className={`s-nav${scrolled ? ' is-scrolled' : ''}`}>
                <div className="s-nav__inner">
                    <Link to="/" className="s-brand">News Platform</Link>

                    <nav className="s-links" aria-label="Main">
                        <NavLink to="/" end className={linkClass}>News</NavLink>
                        <NavLink to="/live" className={linkClass}>Live</NavLink>
                        <NavLink to="/categories" className={linkClass}>Categories</NavLink>
                        {user && (
                            <NavLink to="/bookmarks" className={linkClass}>
                                Bookmarks
                                {bookmarkCount > 0 && <span className="s-count">{bookmarkCount}</span>}
                            </NavLink>
                        )}
                        {user && <NavLink to="/feedback" className={linkClass}>Feedback</NavLink>}
                        <NavLink to="/about" className={linkClass}>About</NavLink>
                        <NavLink to="/contact" className={linkClass}>Contact</NavLink>
                    </nav>

                    <div className="s-account">
                        {user ? (
                            <>
                                <NavLink
                                    to="/profile"
                                    className={({ isActive }) => `s-user${isActive ? ' is-active' : ''}`}
                                    title="Open your profile"
                                    aria-label={`${user.name}, open your profile`}
                                >
                                    <span className="s-avatar" aria-hidden="true">
                                        {user.name.trim().charAt(0).toUpperCase()}
                                    </span>
                                    <span className="s-name">{user.name}</span>
                                </NavLink>
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