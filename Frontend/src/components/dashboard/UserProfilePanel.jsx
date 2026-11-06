import { Link } from 'react-router-dom';
import { useArticles } from '../../context/ArticlesContext';
import { useActivity } from '../../context/ActivityContext';
import { ROLE_LABELS, ROLE_OPTIONS } from '../../data/roles';
import StatusBadge from './StatusBadge';
import '../../style/UserProfile.css';

const ROLE_ABOUT = {
    ...Object.fromEntries(ROLE_OPTIONS.map((r) => [r.value, r.description])),
    admin: 'Manage users, handle reports and keep the platform healthy.',
};

const formatDate = (value) => {
    if (!value) return 'Not available';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

// What an admin sees after clicking a user in the Users table.
export default function UserProfilePanel({ user, roles, isYou, onBack, onChangeRole, onToggleActive }) {
    const { articles } = useArticles();
    const { comments, feedback, saved } = useActivity();

    const stories = articles.filter((a) => a.authorEmail === user.email);
    const showStories = ['journalist', 'publisher'].includes(user.role) || stories.length > 0;
    const count = (...statuses) => stories.filter((a) => statuses.includes(a.status)).length;

    const myComments = comments.filter((c) => c.email === user.email);
    const myFeedback = feedback.filter((f) => f.email === user.email).length;
    const myBookmarks = Object.values(saved).filter((list) => list.includes(user.email)).length;
    const recentStories = [...stories].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    return (
        <section className="up" aria-label={`Profile of ${user.name}`}>
            <div className="up__top">
                <button type="button" className="dbtn" onClick={onBack}>&larr; Back to users</button>
                {isYou && <span className="up__you">This is your own account</span>}
            </div>

            <div className="up__grid">
                <div className="up__col">
                    <div className="up__card up__hero">
                        <span className="up__avatar" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
                        <div className="up__who">
                            <h2 className="up__name">{user.name}</h2>
                            <p className="up__email">{user.email}</p>
                            <p className="up__tags">
                                <span className="up__role">{ROLE_LABELS[user.role] || user.role}</span>
                                <span className={`badge badge--${user.active ? 'active' : 'suspended'}`}>
                                    {user.active ? 'Active' : 'Suspended'}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="up__card">
                        <h3 className="up__h3">Account details</h3>
                        <dl className="up__details">
                            <div><dt>Full name</dt><dd>{user.name}</dd></div>
                            <div><dt>Email</dt><dd>{user.email}</dd></div>
                            <div><dt>Mobile number</dt><dd>{user.phone || 'Not provided'}</dd></div>
                            <div><dt>Joined</dt><dd>{formatDate(user.joined)}</dd></div>
                            <div><dt>Role</dt><dd>{ROLE_LABELS[user.role] || user.role}</dd></div>
                        </dl>
                        <p className="up__about">{ROLE_ABOUT[user.role]}</p>
                    </div>

                    <div className="up__card">
                        <h3 className="up__h3">Manage this user</h3>
                        {isYou ? (
                            <p className="up__note">
                                You cannot change your own role or suspend yourself. Edit your details from{' '}
                                <Link to="/profile">your profile</Link>.
                            </p>
                        ) : (
                            <div className="up__actions">
                                <label htmlFor={`up-role-${user.id}`}>Role</label>
                                <select
                                    id={`up-role-${user.id}`}
                                    value={user.role}
                                    onChange={(e) => onChangeRole(user.id, e.target.value)}
                                >
                                    {roles.map((r) => (
                                        <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className={`dbtn ${user.active ? 'dbtn--danger' : 'dbtn--good'}`}
                                    onClick={() => onToggleActive(user.id)}
                                >
                                    {user.active ? 'Suspend account' : 'Restore account'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="up__col">
                    <div className="up__card">
                        <h3 className="up__h3">Activity</h3>
                        <div className="up__stats">
                            {showStories && (
                                <>
                                    <div><strong>{stories.length}</strong><span>Stories</span></div>
                                    <div><strong>{count('published')}</strong><span>Published</span></div>
                                    <div><strong>{count('submitted')}</strong><span>In review</span></div>
                                    <div><strong>{count('changes_requested', 'rejected')}</strong><span>Sent back</span></div>
                                </>
                            )}
                            <div><strong>{myComments.length}</strong><span>Comments</span></div>
                            <div><strong>{myFeedback}</strong><span>Feedback</span></div>
                            <div><strong>{myBookmarks}</strong><span>Bookmarks</span></div>
                        </div>
                    </div>

                    {showStories && (
                        <div className="up__card">
                            <h3 className="up__h3">Recent stories</h3>
                            {recentStories.length === 0 ? (
                                <p className="up__note">No stories written yet.</p>
                            ) : (
                                <ul className="up__list">
                                    {recentStories.map((a) => (
                                        <li key={a.id}>
                                            <span className="up__list-title">{a.title}</span>
                                            <StatusBadge status={a.status} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="up__card">
                        <h3 className="up__h3">Recent comments</h3>
                        {myComments.length === 0 ? (
                            <p className="up__note">No comments yet.</p>
                        ) : (
                            <ul className="up__list">
                                {myComments.slice(-3).reverse().map((c) => (
                                    <li key={c.id}>
                                        <span className="up__list-title">&ldquo;{c.text}&rdquo;</span>
                                        <span className="up__date">{c.date}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
