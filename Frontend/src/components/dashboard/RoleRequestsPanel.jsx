import { useCallback, useEffect, useState } from "react";
import { getPendingRequests, reviewRequest } from "../../services/roleRequestService";
import { ROLE_LABELS } from "../../data/roles";

export default function RoleRequestsPanel() {
    const [requests, setRequests] = useState([]);
    const [reviewNotes, setReviewNotes] = useState({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadRequests = useCallback(async () => {
        try {
            setRequests(await getPendingRequests());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const decide = async (request, decision) => {
        const reviewNote = reviewNotes[request._id] || "";
        if (decision === "rejected" && !reviewNote.trim()) {
            setError("Add a reason before rejecting a role request.");
            return;
        }

        setBusyId(request._id);
        setError("");
        setMessage("");
        try {
            await reviewRequest(request._id, decision, reviewNote);
            setRequests((current) => current.filter((item) => item._id !== request._id));
            setMessage(`The ${ROLE_LABELS[request.requestedRole] || request.requestedRole} request was ${decision}.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId("");
        }
    };

    return (
        <>
            <h2 className="dash__h2">Role requests</h2>
            <p className="muted">Approve a request to change the account's role. The new role takes effect after the user logs in again.</p>
            {message && <p className="dnote" role="status">{message}</p>}
            {error && <p className="derr" role="alert">{error}</p>}
            {loading ? (
                <p className="empty-note">Loading role requests...</p>
            ) : requests.length === 0 ? (
                <p className="empty-note">No role requests are waiting for review.</p>
            ) : (
                <div className="list">
                    {requests.map((request) => (
                        <article key={request._id} className="item">
                            <p className="item__cat">{ROLE_LABELS[request.requestedRole] || request.requestedRole} request</p>
                            <h3 className="item__title">{request.user?.fullName || "Unknown user"}</h3>
                            <p className="item__meta">
                                <span>{request.user?.email}</span>
                                <span>Organization: {request.organization}</span>
                            </p>
                            {request.proofLink && (
                                <p className="item__meta">
                                    <a href={request.proofLink} target="_blank" rel="noreferrer">View proof</a>
                                </p>
                            )}
                            {request.message && <p className="item__body">{request.message}</p>}
                            <label className="dfield">
                                <span>Review note (required to reject)</span>
                                <textarea
                                    value={reviewNotes[request._id] || ""}
                                    onChange={(event) => setReviewNotes((current) => ({
                                        ...current,
                                        [request._id]: event.target.value,
                                    }))}
                                    maxLength={300}
                                />
                            </label>
                            <div className="btn-row">
                                <button
                                    type="button"
                                    className="dbtn dbtn--good"
                                    onClick={() => decide(request, "approved")}
                                    disabled={Boolean(busyId)}
                                >
                                    {busyId === request._id ? "Saving..." : "Approve"}
                                </button>
                                <button
                                    type="button"
                                    className="dbtn dbtn--danger"
                                    onClick={() => decide(request, "rejected")}
                                    disabled={Boolean(busyId)}
                                >
                                    Reject
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}
