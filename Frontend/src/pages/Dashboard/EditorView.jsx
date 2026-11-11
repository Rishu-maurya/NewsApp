import { useCallback, useEffect, useState } from 'react';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { useNews } from '../../context/NewsContext';
import { decideArticle, getReviewQueue } from '../../services/newsService';
import '../../style/EditorView.css';

export default function EditorView() {
    const { refresh: refreshNews } = useNews();
    const [pending, setPending] = useState([]);
    const [decided, setDecided] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [openId, setOpenId] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');

    // Load the review queue from the server (GET /api/articles/review)
    const load = useCallback(async () => {
        setError('');
        try {
            const queue = await getReviewQueue();
            setPending(queue.pending);
            setDecided(queue.decided);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const count = (status) => decided.filter((a) => a.status === status).length;

    const toggle = (id) => {
        setOpenId(openId === id ? null : id);
        setFeedback('');
        setError('');
    };

    const decide = async (id, decision) => {
        if (decision !== 'published' && !feedback.trim()) {
            return setError('Add feedback so the journalist knows what to fix.');
        }
        setBusy(true);
        setError('');
        try {
            await decideArticle(id, decision, decision === 'published' ? '' : feedback.trim());
            setOpenId(null);
            setFeedback('');
            await load();
            if (decision === 'published') refreshNews(); // readers see it straight away
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <p className="empty-note">Loading the review queue...</p>;

    return (
        <>
            <div className="stats">
                <StatCard label="Waiting for review" value={pending.length} />
                <StatCard label="Published" value={count('published')} />
                <StatCard label="Changes requested" value={count('changes_requested')} />
                <StatCard label="Rejected" value={count('rejected')} />
            </div>

            {error && openId === null && <p className="derr" role="alert">{error}</p>}

            <h2 className="dash__h2">Review queue</h2>
            {pending.length === 0 ? (
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

                                    {error && <p className="derr" role="alert">{error}</p>}
                                    <label htmlFor={`fb-${a.id}`} className="muted">
                                        Feedback for the journalist (needed for changes or rejection)
                                    </label>
                                    <textarea
                                        id={`fb-${a.id}`}
                                        className="feedback-input"
                                        value={feedback}
                                        onChange={(e) => {
                                            setFeedback(e.target.value);
                                            setError('');
                                        }}
                                        placeholder="Explain what needs to change"
                                    />

                                    <div className="btn-row">
                                        <button type="button" className="dbtn dbtn--good" disabled={busy} onClick={() => decide(a.id, 'published')}>
                                            Approve and publish
                                        </button>
                                        <button type="button" className="dbtn" disabled={busy} onClick={() => decide(a.id, 'changes_requested')}>
                                            Request changes
                                        </button>
                                        <button type="button" className="dbtn dbtn--danger" disabled={busy} onClick={() => decide(a.id, 'rejected')}>
                                            Reject
                                        </button>
                                        <button type="button" className="dbtn" disabled={busy} onClick={() => toggle(a.id)}>
                                            Close
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button type="button" className="dbtn dbtn--primary" onClick={() => toggle(a.id)}>
                                    Read and review
                                </button>
                            )}
                        </article>
                    ))}
                </div>
            )}

            <h2 className="dash__h2">Recent decisions</h2>
            {decided.length === 0 ? (
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
                            {decided.slice(0, 10).map((a) => (
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
