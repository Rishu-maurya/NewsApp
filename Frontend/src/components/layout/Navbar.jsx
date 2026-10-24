import { Link } from 'react-router-dom';

export default function Navbar({ session, onLogout }) {
    return (
        <header className="nav">
            <div className="nav__inner">
                <Link to="/" className="nav__brand">News Platform</Link>

                <nav className="nav__links" aria-label="Account">
                    {session ? (
                        <>
                            <span className="nav__user">
                                {session.user.name}
                                {session.user.role !== 'reader' && (
                                    <span className="nav__role">{session.user.role}</span>
                                )}
                            </span>
                            <button type="button" className="nav__btn" onClick={onLogout}>
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav__link">Log in</Link>
                            <Link to="/register" className="nav__btn nav__btn--solid">Create account</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}