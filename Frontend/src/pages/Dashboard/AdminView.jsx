import { useEffect, useState } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import RoleRequestsPanel from '../../components/dashboard/RoleRequestsPanel';
import { getReviewQueue } from '../../services/editorService';
import { getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from '../../services/adminService';
import '../../style/AdminView.css';

const ROLES = ['reader', 'journalist', 'editor', 'publisher', 'admin'];
export default function AdminView({ session }) {
    const [users, setUsers] = useState([]);
    const [articleCounts, setArticleCounts] = useState({});
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        Promise.all([getAdminUsers(page), getReviewQueue()])
            .then(([userResult, queue]) => {
                if (cancelled) return;
                setUsers(userResult.users);
                setPagination(userResult.pagination);
                setArticleCounts(queue.counts);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [page]);

    const changeRole = async (id, role) => {
        setBusyId(id);
        setError('');
        setMessage('');
        try {
            const updated = await updateAdminUserRole(id, role);
            setUsers((current) => current.map((user) => user.id === id ? updated : user));
            setMessage('User role updated.');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId('');
        }
    };

    const toggleActive = async (user) => {
        setBusyId(user.id);
        setError('');
        setMessage('');
        try {
            const updated = await updateAdminUserStatus(user.id, !user.active);
            setUsers((current) => current.map((item) => item.id === user.id ? updated : item));
            setMessage(updated.active ? 'User account restored.' : 'User account suspended.');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId('');
        }
    };

    return (
        <>
            <RoleRequestsPanel />
            <div className="stats">
                <StatCard label="Users" value={pagination.total} />
                <StatCard label="Published stories" value={articleCounts.published || 0} />
                <StatCard label="Waiting for review" value={articleCounts.submitted || 0} />
                <StatCard label="Approved for publishing" value={articleCounts.approved || 0} />
            </div>
            {error && <p className="derr" role="alert">{error}</p>}
            {message && <p className="dnote" role="status">{message}</p>}

            <h2 className="dash__h2">Users</h2>
            {loading ? (
                <p className="empty-note">Loading database users...</p>
            ) : users.length === 0 ? (
                <p className="empty-note">No user accounts found.</p>
            ) : (
                <>
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
                                {users.map((user) => {
                                    const isYou = user.email === session.user.email;
                                    return (
                                        <tr key={user.id}>
                                            <td>{user.name}{isYou && <span className="muted"> (you)</span>}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <select
                                                    value={user.role}
                                                    disabled={isYou || Boolean(busyId)}
                                                    onChange={(event) => changeRole(user.id, event.target.value)}
                                                    aria-label={`Role for ${user.name}`}
                                                >
                                                    {ROLES.map((role) => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <span className={`badge badge--${user.active ? 'active' : 'suspended'}`}>
                                                    {user.active ? 'Active' : 'Suspended'}
                                                </span>
                                            </td>
                                            <td>
                                                {!isYou && (
                                                    <button
                                                        type="button"
                                                        className="dbtn"
                                                        onClick={() => toggleActive(user)}
                                                        disabled={Boolean(busyId)}
                                                    >
                                                        {busyId === user.id ? 'Saving...' : user.active ? 'Suspend' : 'Restore'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {pagination.totalPages > 1 && (
                        <div className="btn-row" aria-label="User pages">
                            <button type="button" className="dbtn" onClick={() => setPage((current) => current - 1)} disabled={page <= 1 || loading}>
                                Previous
                            </button>
                            <span className="muted">Page {page} of {pagination.totalPages}</span>
                            <button type="button" className="dbtn" onClick={() => setPage((current) => current + 1)} disabled={page >= pagination.totalPages || loading}>
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </>
    );
}