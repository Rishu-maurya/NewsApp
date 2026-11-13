import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import PublisherLayout from '../../components/publisher/PublisherLayout';
import LoginPrompt from '../../components/news/LoginPrompt';
import { useActivity } from '../../context/ActivityContext';
import { useArticles } from '../../context/ArticlesContext';
import { HOME_BY_ROLE, ROLE_LABELS } from '../../data/roles';
import { updateProfile, updateStoredSession } from '../../services/authService';
import { validateName, validatePhone } from '../../utils/validators';
import { isLive } from '../../utils/dateUtils';
import '../../style/Profile.css';
import '../../style/InfoCard.css';

const DASHBOARD_ROLES = ['admin', 'editor'];
const PUBLISHER_ROLES = ['publisher', 'journalist'];

const PROFILE_TITLE = 'Your profile';
const PROFILE_SUBTITLE = 'Keep your name and contact details up to date.';

// Staff open their profile from the dashboard navbar, so the page keeps the same
// navbar they came from. Readers and signed-out visitors keep the public site layout.
function ProfileShell({ session, onLogout, children }) {
    const role = session?.user?.role;

    if (DASHBOARD_ROLES.includes(role)) {
        return (
            <DashboardLayout session={session} onLogout={onLogout} title={PROFILE_TITLE} subtitle={PROFILE_SUBTITLE}>
                {children}
            </DashboardLayout>
        );
    }
    if (PUBLISHER_ROLES.includes(role)) {
        return (
            <PublisherLayout session={session} onLogout={onLogout} title={PROFILE_TITLE} subtitle={PROFILE_SUBTITLE}>
                {children}
            </PublisherLayout>
        );
    }
    return <SiteLayout session={session} onLogout={onLogout}>{children}</SiteLayout>;
}

export default function Profile({ session, onLogout, onSessionUpdate }) {
    const { articles } = useArticles();
    const { feedback, comments, saved } = useActivity();
    const navigate = useNavigate();
    const user = session?.user;

    const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState(null);
    const [saving, setSaving] = useState(false);

    if (!user) {
        return (
            <SiteLayout session={session} onLogout={onLogout}>
                <h1 className="s-h1">Update profile</h1>
                <p className="s-sub">Sign in to edit your account details.</p>
                <LoginPrompt message="Log in to update your profile." />
            </SiteLayout>
        );
    }

    const commentCount = comments.filter((comment) => comment.email === user.email).length;
    const feedbackCount = feedback.filter((item) => item.email === user.email).length;
    const bookmarkCount = articles.filter(
        (article) => isLive(article) && (saved[String(article.id)] || []).includes(user.email)
    ).length;

    const unchanged =
        form.name.trim() === user.name && form.phone.trim() === (user.phone || '');

    const handleChange = (e) => {
        const { name, value } = e.target;
        const next = name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value;
        setForm((prev) => ({ ...prev, [name]: next }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
        setStatus(null);
    };

    const handleReset = () => {
        setForm({ name: user.name, phone: user.phone || '' });
        setErrors({});
        setStatus(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const nextErrors = { name: validateName(form.name), phone: validatePhone(form.phone) };
        setErrors(nextErrors);
        if (nextErrors.name || nextErrors.phone) return;

        setSaving(true);
        try {
            const updated = await updateProfile(session, form);
            updateStoredSession(updated);
            onSessionUpdate?.(updated);
            setForm({ name: updated.user.name, phone: updated.user.phone || '' });
            setStatus({ type: 'ok', text: 'Your profile has been updated.' });
        } catch (err) {
            setStatus({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    const isStaff = DASHBOARD_ROLES.includes(user.role) || PUBLISHER_ROLES.includes(user.role);

    return (
        <ProfileShell session={session} onLogout={onLogout}>
            {isStaff ? (
                <p className="s-profile-back">
                    <Link to={HOME_BY_ROLE[user.role] || '/'} className="s-btn s-btn--small">
                        &larr; Back to dashboard
                    </Link>
                </p>
            ) : (
                <section className="s-page-intro">
                    <p className="s-eyebrow">Account</p>
                    <h1 className="s-h1">Update profile</h1>
                    <p className="s-sub">{PROFILE_SUBTITLE}</p>
                </section>
            )}

            <div className="s-profile-layout">
                <section className="s-info-card s-profile-form-card">
                    <h2 className="s-h2">Your details</h2>

                    {status?.type === 'ok' && <div className="s-note" role="status">{status.text}</div>}
                    {status?.type === 'error' && <div className="s-err" role="alert">{status.text}</div>}

                    <form className="s-form" onSubmit={handleSubmit} noValidate>
                        <div className="s-field">
                            <label className="s-label" htmlFor="name">Full name</label>
                            <input
                                id="name"
                                name="name"
                                className="s-input"
                                type="text"
                                autoComplete="name"
                                value={form.name}
                                onChange={handleChange}
                                aria-invalid={Boolean(errors.name)}
                            />
                            {errors.name && <p className="s-field-error">{errors.name}</p>}
                        </div>

                        <div className="s-field">
                            <label className="s-label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                className="s-input"
                                type="email"
                                value={user.email}
                                disabled
                            />
                            <p className="s-hint">Email cannot be changed here.</p>
                        </div>

                        <div className="s-field">
                            <label className="s-label" htmlFor="phone">Mobile number (optional)</label>
                            <input
                                id="phone"
                                name="phone"
                                className="s-input"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                placeholder="10 digit mobile number"
                                value={form.phone}
                                onChange={handleChange}
                                aria-invalid={Boolean(errors.phone)}
                            />
                            {errors.phone && <p className="s-field-error">{errors.phone}</p>}
                        </div>

                        <div className="s-form-actions">
                            <button type="submit" className="s-btn s-btn--solid" disabled={saving || unchanged}>
                                {saving ? 'Saving...' : 'Save changes'}
                            </button>
                            <button type="button" className="s-btn" onClick={handleReset} disabled={saving || unchanged}>
                                Reset
                            </button>
                        </div>
                    </form>
                </section>

                <aside className="s-profile-side">
                    <section className="s-info-card s-profile-card">
                        <span className="s-profile-avatar" aria-hidden="true">
                            {user.name.trim().charAt(0).toUpperCase()}
                        </span>
                        <div>
                            <h2 className="s-profile-name">{user.name}</h2>
                            <p className="s-profile-email">{user.email}</p>
                            <span className="s-role-pill">{ROLE_LABELS[user.role] || user.role}</span>
                        </div>
                    </section>

                    <section className="s-info-card s-profile-signout">
                        <h2 className="s-h2">Sign out</h2>
                        <p className="s-hint">You are signed in as {user.email}. Log out to end your session on this device.</p>
                        <button type="button" className="s-btn s-btn--logout" onClick={handleLogout}>
                            Log out
                        </button>
                    </section>

                    <section className="s-info-card">
                        <h2 className="s-h2">Your activity</h2>
                        <div className="s-profile-stats">
                            <Link to="/bookmarks"><strong>{bookmarkCount}</strong><span>Bookmarks</span></Link>
                            <div><strong>{commentCount}</strong><span>Comments</span></div>
                            <Link to="/feedback"><strong>{feedbackCount}</strong><span>Feedback entries</span></Link>
                        </div>
                    </section>
                </aside>
            </div>
        </ProfileShell>
    );
}