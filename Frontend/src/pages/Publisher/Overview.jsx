import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublisherLayout from '../../components/publisher/PublisherLayout';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';
import RoleRequestsPanel from '../../components/dashboard/RoleRequestsPanel';
import { getMyArticles, getPublishQueue, publishApprovedArticle } from '../../services/publisherService';

const STATUSES = ['approved', 'submitted', 'changes_requested', 'draft', 'published', 'rejected'];

export default function Overview({ session, onLogout }) {
    const [mine, setMine] = useState([]);
    const [publishQueue, setPublishQueue] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState('');
    const isPublisher = session.user.role === 'publisher';

    const refresh = useCallback(async (quiet = false) => {
        if (!quiet) setRefreshing(true);
        setError('');
        try {
            const [articles, approvedStories] = await Promise.all([
                getMyArticles(),
                isPublisher ? getPublishQueue() : Promise.resolve([]),
            ]);
            setMine(articles);
            setPublishQueue(approvedStories);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isPublisher]);

    useEffect(() => {
        const refreshOnFocus = () => refresh(true);
        refresh();
        window.addEventListener('focus', refreshOnFocus);
        return () => window.removeEventListener('focus', refreshOnFocus);
    }, [refresh]);

    const publishStory = async (id) => {
        setBusyId(id);
        setError('');
        try {
            await publishApprovedArticle(id);
            await refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId('');
        }
    };

    const count = (status) => mine.filter((article) => article.status === status).length;
    const attention = mine.filter((article) => article.status === 'changes_requested');
    const recent = [...mine].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    return (
        <PublisherLayout
            session={session}
            onLogout={onLogout}
            title={`Welcome, ${session.user.name}`}
            subtitle={isPublisher ? 'Move editor-approved reporting to readers.' : 'Track your stories and see what needs your attention.'}
        >
            <div className="pub-dashboard">
                {error && <p className="derr" role="alert">{error}</p>}
                {loading ? (
                    <p className="empty-note">Loading publishing desk...</p>
                ) : (
                    <>
                        <div className="stats pub-dashboard__stats">
                            {STATUSES.map((status) => (
                                <StatCard
                                    key={status}
                                    label={{
                                        draft: 'My drafts',
                                        submitted: 'In review',
                                        changes_requested: 'Changes requested',
                                        approved: isPublisher ? 'Ready to publish' : 'Approved',
                                        published: 'My published',
                                        rejected: 'Rejected',
                                    }[status]}
                                    value={status === 'approved' && isPublisher ? publishQueue.length : count(status)}
                                />
                            ))}
                        </div>

                        {isPublisher && (
                            <section className="pub-dashboard__queue" aria-labelledby="publish-queue-title">
                                <header className="pub-dashboard__section-head">
                                    <div>
                                        <p className="pub-dashboard__eyebrow">Editorial handoff</p>
                                        <h2 className="dash__h2" id="publish-queue-title">Ready to publish</h2>
                                        <p className="pub-dashboard__hint">Stories approved by an editor and waiting for your final publish action.</p>
                                    </div>
                                    <div className="pub-dashboard__queue-actions">
                                        <span className="pub-dashboard__queue-count">{publishQueue.length} waiting</span>
                                        <button type="button" className="dbtn" onClick={() => refresh()} disabled={refreshing}>
                                            {refreshing ? 'Refreshing...' : 'Refresh queue'}
                                        </button>
                                    </div>
                                </header>
                                {publishQueue.length === 0 ? (
                                    <p className="empty-note pub-dashboard__empty">No editor-approved stories are waiting to be published.</p>
                                ) : (
                                    <div className="list pub-dashboard__queue-list">
                                        {publishQueue.map((article) => (
                                            <article key={article.id} className="item pub-dashboard__story">
                                                <div className="item__top">
                                                    <div>
                                                        <p className="item__cat">{article.category}</p>
                                                        <h3 className="item__title">{article.title}</h3>
                                                    </div>
                                                    <StatusBadge status={article.status} />
                                                </div>
                                                <p className="item__meta"><span>By {article.author}</span><span>Approved {article.date}</span></p>
                                                <p className="item__body">{article.body}</p>
                                                <div className="pub-dashboard__story-footer">
                                                    {article.important && <span className="pub-dashboard__important">Priority story</span>}
                                                    <button
                                                        type="button"
                                                        className="dbtn dbtn--good"
                                                        onClick={() => publishStory(article.id)}
                                                        disabled={Boolean(busyId)}
                                                    >
                                                        {busyId === article.id ? 'Publishing...' : 'Publish for readers'}
                                                    </button>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {isPublisher && <RoleRequestsPanel />}

                        <section className="pub-dashboard__mine">
                            <header className="pub-dashboard__section-head">
                                <div>
                                    <p className="pub-dashboard__eyebrow">Your workspace</p>
                                    <h2 className="dash__h2">My stories</h2>
                                </div>
                                <div className="pub-dashboard__queue-actions">
                                    <Link to="/publisher/write" className="dbtn dbtn--primary">Write a story</Link>
                                    <Link to="/publisher/stories" className="dbtn">All stories</Link>
                                </div>
                            </header>
                            {mine.length === 0 ? (
                                <p className="empty-note">You have not written any stories yet.</p>
                            ) : (
                                <>
                                    {attention.length > 0 && (
                                        <div className="pub-dashboard__attention">
                                            <h3>Needs your attention</h3>
                                            {attention.map((article) => (
                                                <article key={article.id} className="item">
                                                    <div className="item__top">
                                                        <div>
                                                            <p className="item__cat">{article.category}</p>
                                                            <h3 className="item__title">{article.title}</h3>
                                                        </div>
                                                        <StatusBadge status={article.status} />
                                                    </div>
                                                    {article.feedback && <p className="feedback">Editor feedback: {article.feedback}</p>}
                                                    <Link to={`/publisher/write/${article.id}`} className="dbtn dbtn--primary">Fix and resend</Link>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                    <div className="table-wrap">
                                        <table className="dtable">
                                            <thead><tr><th>Story</th><th>Status</th><th>Updated</th></tr></thead>
                                            <tbody>
                                                {recent.map((article) => (
                                                    <tr key={article.id}>
                                                        <td>{article.title}</td>
                                                        <td><StatusBadge status={article.status} /></td>
                                                        <td>{article.date}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </section>
                    </>
                )}
            </div>
        </PublisherLayout>
    );
}