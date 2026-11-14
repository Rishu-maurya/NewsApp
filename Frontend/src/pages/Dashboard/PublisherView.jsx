import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RoleRequestsPanel from "../../components/dashboard/RoleRequestsPanel";
import StatCard from "../../components/dashboard/StatCard";
import StatusBadge from "../../components/dashboard/StatusBadge";
import { getMyArticles, getPublishQueue, publishApprovedArticle } from "../../services/publisherService";

const STATUSES = ["draft", "submitted", "changes_requested", "approved", "published", "rejected"];

export default function PublisherView() {
    const [articles, setArticles] = useState([]);
    const [publishQueue, setPublishQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");

    useEffect(() => {
        let cancelled = false;
        Promise.all([getMyArticles(), getPublishQueue()])
            .then(([stories, approvedStories]) => {
                if (!cancelled) {
                    setArticles(stories);
                    setPublishQueue(approvedStories);
                }
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

    const publishStory = async (id) => {
        setBusyId(id);
        setError("");
        try {
            await publishApprovedArticle(id);
            const [stories, approvedStories] = await Promise.all([getMyArticles(), getPublishQueue()]);
            setArticles(stories);
            setPublishQueue(approvedStories);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId("");
        }
    };

    return (
        <>
            <RoleRequestsPanel />
            <h2 className="dash__h2">Approved for publishing</h2>
            {loading ? (
                <p className="empty-note">Loading approved stories...</p>
            ) : publishQueue.length === 0 ? (
                <p className="empty-note">No editor-approved stories are waiting to be published.</p>
            ) : (
                <div className="list">
                    {publishQueue.map((article) => (
                        <article key={article.id} className="item">
                            <div className="item__top">
                                <div>
                                    <p className="item__cat">{article.category}</p>
                                    <h3 className="item__title">{article.title}</h3>
                                </div>
                                <StatusBadge status={article.status} />
                            </div>
                            <p className="item__meta"><span>Approved by editor · By {article.author}</span></p>
                            <p className="item__body">{article.body}</p>
                            <div className="btn-row">
                                <button
                                    type="button"
                                    className="dbtn dbtn--good"
                                    onClick={() => publishStory(article.id)}
                                    disabled={Boolean(busyId)}
                                >
                                    {busyId === article.id ? "Publishing..." : "Publish for readers"}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
            <h2 className="dash__h2">Your stories</h2>
            <p><Link to="/publisher/write" className="dbtn dbtn--primary">Write a story</Link></p>
            {error && <p className="derr" role="alert">{error}</p>}
            {loading ? (
                <p className="empty-note">Loading your stories...</p>
            ) : (
                <>
                    <div className="stats">
                        {STATUSES.map((status) => (
                            <StatCard
                                key={status}
                                label={{
                                    draft: "Drafts",
                                    submitted: "In review",
                                    changes_requested: "Changes requested",
                                    approved: "Approved for publishing",
                                    published: "Published",
                                    rejected: "Rejected",
                                }[status]}
                                value={articles.filter((article) => article.status === status).length}
                            />
                        ))}
                    </div>
                    {articles.length === 0 ? (
                        <p className="empty-note">You have not written any stories yet.</p>
                    ) : (
                        <div className="table-wrap">
                            <table className="dtable">
                                <thead>
                                    <tr><th>Story</th><th>Category</th><th>Status</th><th>Updated</th></tr>
                                </thead>
                                <tbody>
                                    {articles.slice(0, 5).map((article) => (
                                        <tr key={article.id}>
                                            <td>{article.title}</td>
                                            <td>{article.category}</td>
                                            <td><StatusBadge status={article.status} /></td>
                                            <td>{article.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <p><Link to="/publisher/stories" className="dbtn">Manage all stories</Link></p>
                </>
            )}
        </>
    );
}
