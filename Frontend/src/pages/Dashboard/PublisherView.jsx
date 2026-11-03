import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RoleRequestsPanel from "../../components/dashboard/RoleRequestsPanel";
import StatCard from "../../components/dashboard/StatCard";
import StatusBadge from "../../components/dashboard/StatusBadge";
import { getMyArticles } from "../../services/publisherService";

const STATUSES = ["draft", "submitted", "changes_requested", "published", "rejected"];

export default function PublisherView() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        getMyArticles()
            .then((result) => {
                if (!cancelled) setArticles(result);
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

    return (
        <>
            <RoleRequestsPanel />
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
