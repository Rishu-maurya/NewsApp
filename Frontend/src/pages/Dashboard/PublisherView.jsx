import { useCallback, useEffect, useState } from "react";
import RoleRequestsPanel from "../../components/dashboard/RoleRequestsPanel";
import StatCard from "../../components/dashboard/StatCard";
import StatusBadge from "../../components/dashboard/StatusBadge";
import {
    deleteMyArticle,
    getPublisherArticles,
    publishApprovedArticle,
    returnArticleForReview,
} from "../../services/publisherService";
import "../../style/PublisherView.css";

const FILTERS = ["all", "submitted", "under_review", "approved", "published", "changes_requested", "rejected", "draft", "archived"];
const IN_REVIEW = ["submitted", "under_review"];

export default function PublisherView() {
    const [articles, setArticles] = useState([]);
    const [counts, setCounts] = useState({});
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busyId, setBusyId] = useState("");
    const [returnId, setReturnId] = useState("");
    const [returnNote, setReturnNote] = useState("");

    const refresh = useCallback(async (showProgress = false) => {
        if (showProgress) {
            setRefreshing(true);
            setError("");
        }
        try {
            const result = await getPublisherArticles({ page, status: statusFilter, search });
            setArticles(result.articles);
            setCounts(result.counts);
            setPagination(result.pagination);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [page, statusFilter, search]);

    useEffect(() => {
        const refreshOnFocus = () => refresh();
        refresh();
        window.addEventListener("focus", refreshOnFocus);
        return () => window.removeEventListener("focus", refreshOnFocus);
    }, [refresh]);

    const publishStory = async (id) => {
        setBusyId(id);
        setError("");
        setMessage("");
        try {
            await publishApprovedArticle(id);
            setMessage("Story published successfully.");
            await refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId("");
        }
    };

    const sendBackForReview = async (article) => {
        if (!returnNote.trim()) {
            setError("Add a note for the editor before sending this story back.");
            return;
        }
        setBusyId(article.id);
        setError("");
        setMessage("");
        try {
            await returnArticleForReview(article.id, returnNote.trim());
            setReturnId("");
            setReturnNote("");
            setMessage("Story sent back to the editor review queue.");
            await refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId("");
        }
    };

    const deleteStory = async (article) => {
        if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) return;
        setBusyId(article.id);
        setError("");
        setMessage("");
        try {
            await deleteMyArticle(article.id);
            setMessage("Story deleted.");
            if (articles.length === 1 && page > 1) setPage((current) => current - 1);
            else await refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId("");
        }
    };

    const beginReturn = (article) => {
        setReturnId(returnId === article.id ? "" : article.id);
        setReturnNote(article.publisherNote || "");
        setError("");
    };

    const needsAttention = (counts.changes_requested || 0) + (counts.rejected || 0);

    return (
        <>
            <RoleRequestsPanel />
            <div className="stats">
                <StatCard label="All stories" value={counts.total || 0} />
                <StatCard label="In review" value={counts.submitted || 0} />
                <StatCard label="Ready to publish" value={counts.approved || 0} />
                <StatCard label="Published" value={counts.published || 0} />
                <StatCard label="Needs attention" value={needsAttention} />
            </div>
            {error && <p className="derr" role="alert">{error}</p>}
            {message && <p className="dnote" role="status">{message}</p>}

            <h2 className="dash__h2">All news</h2>
            <div className="pubdash__toolbar">
                <form
                    className="pubdash__filters"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setPage(1);
                        setSearch(searchInput.trim());
                    }}
                >
                    <label className="pubdash__search-label">
                        <span className="sr-only">Search stories</span>
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Search headlines or summaries"
                        />
                    </label>
                    <button type="submit" className="dbtn">Search</button>
                    <label className="pubdash__status-label">
                        <span className="sr-only">Filter by status</span>
                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setPage(1);
                            }}
                        >
                            {FILTERS.map((status) => (
                                <option key={status} value={status}>
                                    {status === "all" ? "Every status" : status.replaceAll("_", " ")}
                                </option>
                            ))}
                        </select>
                    </label>
                </form>
                <button type="button" className="dbtn" onClick={() => refresh(true)} disabled={refreshing}>
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {loading ? (
                <p className="empty-note">Loading newsroom stories...</p>
            ) : articles.length === 0 ? (
                <p className="empty-note">No stories match these filters.</p>
            ) : (
                <>
                    <div className="table-wrap">
                        <table className="dtable pubdash__table">
                            <thead>
                                <tr><th>Story</th><th>Author</th><th>Status</th><th>Updated</th><th>Actions</th></tr>
                            </thead>
                            <tbody>
                                {articles.map((article) => (
                                    <tr key={article.id}>
                                        <td className="pubdash__story-cell">
                                            <strong>{article.title}</strong>
                                            <p>{article.summary}</p>
                                            <details>
                                                <summary>Read full story</summary>
                                                <p className="pubdash__full-story">{article.body}</p>
                                            </details>
                                        </td>
                                        <td>{article.author || "Unknown author"}<span className="pubdash__category">{article.category}</span></td>
                                        <td><StatusBadge status={article.status} /></td>
                                        <td>{article.date || "-"}</td>
                                        <td>
                                            <div className="pubdash__actions">
                                                {article.status !== "published" && (
                                                    <button type="button" className="dbtn dbtn--good" onClick={() => publishStory(article.id)} disabled={Boolean(busyId)}>
                                                        {busyId === article.id ? "Publishing..." : "Publish"}
                                                    </button>
                                                )}
                                                {!IN_REVIEW.includes(article.status) && (
                                                    <button type="button" className="dbtn" onClick={() => beginReturn(article)} disabled={Boolean(busyId)}>
                                                        Send to review
                                                    </button>
                                                )}
                                                <button type="button" className="dbtn dbtn--danger" onClick={() => deleteStory(article)} disabled={Boolean(busyId)}>
                                                    {busyId === article.id ? "Working..." : "Delete"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {articles.map((article) => returnId === article.id && (
                                    <tr key={`${article.id}-return`}>
                                        <td colSpan="5">
                                            <form
                                                className="pubdash__return-form"
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    sendBackForReview(article);
                                                }}
                                            >
                                                <label htmlFor={`return-note-${article.id}`}>Note for the editor</label>
                                                <textarea
                                                    id={`return-note-${article.id}`}
                                                    value={returnNote}
                                                    onChange={(event) => setReturnNote(event.target.value)}
                                                    maxLength={3000}
                                                    required
                                                    placeholder="Explain what needs another review"
                                                />
                                                <div className="pubdash__return-actions">
                                                    <span>{returnNote.length}/3000</span>
                                                    <button type="button" className="dbtn" onClick={() => setReturnId("")}>Cancel</button>
                                                    <button type="submit" className="dbtn dbtn--primary" disabled={Boolean(busyId)}>
                                                        {busyId === article.id ? "Sending..." : "Send for review"}
                                                    </button>
                                                </div>
                                            </form>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="btn-row pubdash__pagination" aria-label="Story pages">
                        <button type="button" className="dbtn" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page <= 1 || refreshing}>
                            Previous
                        </button>
                        <span className="muted">{pagination.total} stories · Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
                        <button type="button" className="dbtn" onClick={() => setPage((current) => current + 1)} disabled={page >= pagination.totalPages || refreshing}>
                            Next
                        </button>
                    </div>
                </>
            )}
        </>
    );
}
