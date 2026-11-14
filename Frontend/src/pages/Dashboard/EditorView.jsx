import { useEffect, useState } from 'react';
import { getReviewQueue, reviewArticle } from '../../services/editorService';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import '../../style/EditorView.css';

export default function EditorView() {
    const [pending, setPending] = useState([]);
    const [decided, setDecided] = useState([]);
    const [counts, setCounts] = useState({});
    const [openId, setOpenId] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');
    const [important, setImportant] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState('');

    const refreshQueue = async () => {
        const queue = await getReviewQueue();
        setPending(queue.pending);
        setDecided(queue.decided);
        setCounts(queue.counts);
    };

    useEffect(() => {
        let cancelled = false;
        getReviewQueue()
            .then((queue) => {
                if (cancelled) return;
                setPending(queue.pending);
                setDecided(queue.decided);
                setCounts(queue.counts);
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
    }, []);

    const count = (status) => counts[status] || 0;

    const toggle = (story) => {
        setImportant(!!story?.important);
        setOpenId(openId === story.id ? null : story.id);
        setFeedback('');
        setError('');
    };

    const decide = async (id, decision) => {
        if (decision !== 'approved' && !feedback.trim()) {
            return setError('Add feedback so the journalist knows what to fix.');
        }
        setBusyId(id);
        setError('');
        try {
            await reviewArticle(id, decision, decision === 'approved' ? '' : feedback.trim(), important);
            await refreshQueue();
            setOpenId(null);
            setFeedback('');
        } catch (err) {
            setError(err.message);
            try {
                await refreshQueue();
            } catch {
                // Keep the original action error visible.
            }
        } finally {
            setBusyId('');
        }
    };

    return (
        <>
            <div className="stats">
                <StatCard label="Waiting for review" value={pending.length} />
                <StatCard label="Published" value={count('published')} />
                <StatCard label="Changes requested" value={count('changes_requested')} />
                <StatCard label="Rejected" value={count('rejected')} />
            </div>
            {error && <p className="derr" role="alert">{error}</p>}

            <h2 className="dash__h2">Review queue</h2>
            {loading ? (
                <p className="empty-note">Loading review queue...</p>
            ) : pending.length === 0 ? (
                <p className="empty-note">No stories are waiting. New submissions will appear here.</p>
            ) : (
                <div className="list">
                    {pending.map((a) => (
                        <article key={a.id} className="item">
                            <div className="item__top">
                                <div>
                                    <p className="item__cat">{a.category}</p>
                                    <h3 className="item__title">{a.title}</h3>
                                </div>
                                <StatusBadge status={a.status} />
                            </div>

                            <p className="item__meta">
                                <span>By {a.author}</span>
                                <span>Sent {a.date}</span>
                            </p>

                            {openId === a.id ? (
                                <>
                                    <p className="item__body">{a.body}</p>

                                    <label htmlFor={`fb-${a.id}`} className="muted">
                                        Feedback for the journalist (needed for changes or rejection)
                                    </label>
                                    <textarea
                                        id={`fb-${a.id}`}
                                        className="feedback-input"
                                        value={feedback}
                                        onChange={(e) => {
                                            setFeedback(e.target.value);
                                        }}
                                        placeholder="Explain what needs to change"
                                    />

                                    <label className="dfield--check dfield--inline" htmlFor={`imp-${a.id}`}>
                                        <input
                                            id={`imp-${a.id}`}
                                            type="checkbox"
                                            checked={important}
                                            onChange={(e) => setImportant(e.target.checked)}
                                        />
                                        Mark as an important story (shown in yellow)
                                    </label>

                                    <div className="btn-row">
                                        <button type="button" className="dbtn dbtn--good" onClick={() => decide(a.id, 'approved')} disabled={Boolean(busyId)}>
                                            {busyId === a.id ? 'Approving...' : 'Approve for publisher'}
                                        </button>
                                        <button type="button" className="dbtn" onClick={() => decide(a.id, 'changes_requested')} disabled={Boolean(busyId)}>
                                            Request changes
                                        </button>
                                        <button type="button" className="dbtn dbtn--danger" onClick={() => decide(a.id, 'rejected')} disabled={Boolean(busyId)}>
                                            Reject
                                        </button>
                                        <button type="button" className="dbtn" onClick={() => toggle(a)} disabled={Boolean(busyId)}>
                                            Close
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button type="button" className="dbtn dbtn--primary" onClick={() => toggle(a)}>
                                    Read and review
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            )}

            <h2 className="dash__h2">Recent decisions</h2>
            {loading ? null : decided.length === 0 ? (
                <p className="empty-note">No decisions yet.</p>
            ) : (
                <div className="table-wrap">
                    <table className="dtable">
                        <thead>
                            <tr>
                                <th>Story</th>
                                <th>Author</th>
                                <th>Decision</th>
                            </tr>
                        </thead>
                        <tbody>
                            {decided.map((a) => (
                                <tr key={a.id}>
                                    <td>{a.title}</td>
                                    <td>{a.author}</td>
                                    <td><StatusBadge status={a.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}