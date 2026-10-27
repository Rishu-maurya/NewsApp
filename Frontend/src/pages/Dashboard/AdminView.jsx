import { useState } from 'react';
import { useArticles } from '../../context/ArticlesContext';
import { INITIAL_USERS } from '../../data/dummyData';
import StatCard from '../../components/dashboard/StatCard';
import { useActivity } from '../../context/ActivityContext';
import FeedbackPanel from '../../components/dashboard/FeedbackPanel';
import '../../style/AdminView.css';

const ROLES = ['reader', 'journalist', 'editor', 'admin'];

export default function AdminView({ session }) {
    const { articles, resetDemoData } = useArticles();
    const { reports, updateReport, resetActivity } = useActivity();
    const [users, setUsers] = useState(INITIAL_USERS);
    const [message, setMessage] = useState('');

    const openReports = reports.filter((r) => r.status === 'open');
    const closedReports = reports.filter((r) => r.status !== 'open');

    const changeRole = (id, role) =>
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));

    const toggleActive = (id) =>
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));

    const handleReset = () => {
        resetDemoData();
        resetActivity();
        setUsers(INITIAL_USERS);
        setMessage('Demo data has been reset.');
    };

    return (
        <>
            <div className="stats">
                <StatCard label="Users" value={users.length} />
                <StatCard label="Published stories" value={articles.filter((a) => a.status === 'published').length} />
                <StatCard label="Waiting for review" value={articles.filter((a) => a.status === 'submitted').length} />
                <StatCard label="Open reports" value={openReports.length} />
            </div>
        <FeedbackPanel />
            <h2 className="dash__h2">Content reports</h2>
            {openReports.length === 0 ? (
                <p className="empty-note">No open content reports. Everything has been handled.</p>
            ) : (
                <div className="list">
                    {openReports.map((r) => (
                        <article key={r.id} className="item">
                            <p className="item__cat">{r.reason}</p>
                            <h3 className="item__title">{r.comment}</h3>
                            <p className="item__meta">
                                <span>On: {r.article}</span>
                                <span>Reported by {r.reportedBy}</span>
                            </p>
                            <div className="btn-row">
                                <button type="button" className="dbtn dbtn--danger" onClick={() => updateReport(r.id, 'removed')}>
                                    Mark as removed
                                </button>
                                <button type="button" className="dbtn" onClick={() => updateReport(r.id, 'dismissed')}>
                                    Dismiss report
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {closedReports.length > 0 && (
                <p className="muted muted--report-summary">
                    Handled: {closedReports.map((r) => `"${r.comment.slice(0, 28)}..." (${r.status})`).join(', ')}
                </p>
            )}

            <h2 className="dash__h2">Users</h2>
            <div className="table-wrap">
                <table className="dtable">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => {
                            const isYou = u.email === session.user.email;
                            return (
                                <tr key={u.id}>
                                    <td>{u.name}{isYou && <span className="muted"> (you)</span>}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <select
                                            value={u.role}
                                            disabled={isYou}
                                            onChange={(e) => changeRole(u.id, e.target.value)}
                                            aria-label={`Role for ${u.name}`}
                                        >
                                            {ROLES.map((r) => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`badge badge--${u.active ? 'active' : 'suspended'}`}>
                                            {u.active ? 'Active' : 'Suspended'}
                                        </span>
                                    </td>
                                    <td>
                                        {!isYou && (
                                            <button type="button" className="dbtn" onClick={() => toggleActive(u.id)}>
                                                {u.active ? 'Suspend' : 'Restore'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <h2 className="dash__h2">Demo data</h2>
            <section className="panel">
                {message && <p className="dnote" role="status">{message}</p>}
                <p className="muted muted--reset-summary">
                    Put all stories, users and reports back to how they were at the start.
                </p>
                <button type="button" className="dbtn dbtn--danger" onClick={handleReset}>
                    Reset demo data
                </button>
            </section>
        </>
    );
}