import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useBookmarks } from '../../context/BookmarksContext';
import NavDateFilter from './NavDateFilter';
import '../../style/SiteLayout.css';
import '../../style/Navbar.css';
import '../../style/SiteTheme.css';
import CategoriesMenu from './CategoriesMenu';

const linkClass = ({ isActive }) => `s-link${isActive ? ' is-active' : ''}`;
const topClass = ({ isActive }) => `s-top__link${isActive ? ' is-active' : ''}`;

export default function SiteLayout({ session, children }) {
    const user = session?.user;
    const { ids: serverSaved } = useBookmarks();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const bookmarkCount = user ? serverSaved.size : 0;

    return (
        <div className="site">
            <header className={`s-nav${scrolled ? ' is-scrolled' : ''}`}>
                {/* 1. thin utility bar */}
                <div className="s-top">
                    <div className="s-top__inner">
                        <span className="s-top__tag">Independent voices. Informed communities.</span>
                        <nav className="s-top__links" aria-label="Secondary">
                            <NavLink to="/contact" className={topClass}>Contact</NavLink>
                            {user && <NavLink to="/feedback" className={topClass}>Feedback</NavLink>}
                            <NavLink to="/report" className={topClass}>Report a problem</NavLink>
                        </nav>
                    </div>
                </div>

                {/* 2. masthead: logo + account */}
                <div className="s-mast">
                    <div className="s-mast__inner">
                        <Link to="/" className="s-brand" aria-label="News Platform home">
                            <span className="s-brand__mark" aria-hidden="true">N</span>
                            <span className="s-brand__text">
                                <strong>News Platform</strong>
                                <small>Verified by editors</small>
                            </span>
                        </Link>

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
                                        <span className="s-user__text">
                                            <span className="s-name">{user.name}</span>
                                            <small className="s-user__role">{user.role}</small>
                                        </span>
                                    </NavLink>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="s-btn">Sign in</Link>
                                    <Link to="/register" className="s-btn s-btn--sun">Create account</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. main menu bar */}
                <div className="s-menu">
                    <div className="s-menu__inner">
                        <nav className="s-links" aria-label="Main">
                            <NavLink to="/" end className={linkClass}>News</NavLink>
                            <NavLink to="/live" className={linkClass}>Live</NavLink>
                            <CategoriesMenu />
                            {user && (
                                <NavLink to="/bookmarks" className={linkClass}>
                                    Bookmarks
                                    {bookmarkCount > 0 && <span className="s-count">{bookmarkCount}</span>}
                                </NavLink>
                            )}
                            <NavLink to="/contact" className={linkClass}>Contact</NavLink>
                            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
                        </nav>
                    </div>
                </div>

                {/* 4. date filter strip */}
                <div className="s-nav__row">
                    <NavDateFilter />
                </div>
            </header>

            <main className="s-main">{children}</main>

            <footer className="s-footer">
                <div className="s-footer__inner">
                    <div className="s-footer__brand">
                        <span className="s-brand">
                            <span className="s-brand__mark" aria-hidden="true">N</span>
                            <span className="s-brand__text">
                                <strong>News Platform</strong>
                                <small>Verified by editors</small>
                            </span>
                        </span>
                        <p>Thoughtful local reporting, reviewed by editors and made for curious readers.</p>
                    </div>

                    <div className="s-footer__col">
                        <h4>Explore</h4>
                        <Link to="/">Latest news</Link>
                        <Link to="/live">Live coverage</Link>
                        <Link to="/categories">Categories</Link>
                    </div>

                    <div className="s-footer__col">
                        <h4>Help</h4>
                        <Link to="/contact">Contact us</Link>
                        <Link to="/report">Report a problem</Link>
                        {user ? <Link to="/feedback">Send feedback</Link> : <Link to="/login">Sign in</Link>}
                    </div>

                    <div className="s-footer__col s-footer__promise">
                        <h4>Our promise</h4>
                        <p>Every story is reviewed by an editor before it is published.</p>
                    </div>
                </div>
                <div className="s-footer__bar">
                    <p>&copy; {new Date().getFullYear()} News Platform. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
