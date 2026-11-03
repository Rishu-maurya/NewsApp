import { useCallback, useEffect, useState } from "react";
import { getPendingRequests, reviewRequest } from "../../services/roleRequestService";
import { ROLE_LABELS } from "../../data/roles";
import "../../style/RoleRequests.css";

const NOTE_LIMIT = 300;

// The API may send the requester as a populated object (fullName / name) or
// flat on the request itself, so read every shape instead of showing "Unknown user".
function getRequester(request) {
    const user = request.user && typeof request.user === "object" ? request.user : {};
    return {
        name: user.fullName || user.name || request.fullName || request.name || "Unknown user",
        email: user.email || request.email || "",
    };
}

function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

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
        <section className="rr" aria-labelledby="rr-title">
            <header className="rr__head">
                <div>
                    <h2 className="rr__title" id="rr-title">Role requests</h2>
                    <p className="rr__sub">
                        Approve a request to change the account's role. The new role takes effect after the user logs in again.
                    </p>
                </div>
                {!loading && requests.length > 0 && (
                    <span className="rr__count">{requests.length} pending</span>
                )}
            </header>

            {message && <p className="dnote" role="status">{message}</p>}
            {error && <p className="derr" role="alert">{error}</p>}

            {loading ? (
                <p className="rr__empty">Loading role requests...</p>
            ) : requests.length === 0 ? (
                <p className="rr__empty">No role requests are waiting for review.</p>
            ) : (
                <div className="rr__list">
                    {requests.map((request) => {
                        const { name, email } = getRequester(request);
                        const submitted = formatDate(request.createdAt);
                        const note = reviewNotes[request._id] || "";
                        const noteId = `rr-note-${request._id}`;

                        return (
                            <article key={request._id} className="rr-card">
                                <div className="rr-card__top">
                                    <span className="rr-card__avatar" aria-hidden="true">
                                        {name.trim().charAt(0).toUpperCase()}
                                    </span>
                                    <div className="rr-card__who">
                                        <h3 className="rr-card__name">{name}</h3>
                                        {email && <p className="rr-card__email">{email}</p>}
                                    </div>
                                    <span className="rr-card__role">
                                        {ROLE_LABELS[request.requestedRole] || request.requestedRole} request
                                    </span>
                                </div>

                                <dl className="rr-card__facts">
                                    <div>
                                        <dt>Organization</dt>
                                        <dd>{request.organization || "Not provided"}</dd>
                                    </div>
                                    {submitted && (
                                        <div>
                                            <dt>Requested on</dt>
                                            <dd>{submitted}</dd>
                                        </div>
                                    )}
                                    {request.proofLink && (
                                        <div>
                                            <dt>Proof</dt>
                                            <dd>
                                                <a href={request.proofLink} target="_blank" rel="noreferrer">View proof</a>
                                            </dd>
                                        </div>
                                    )}
                                </dl>

                                {request.message && (
                                    <blockquote className="rr-card__message">{request.message}</blockquote>
                                )}

                                <div className="rr-card__review">
                                    <label htmlFor={noteId}>
                                        Review note <span>(required to reject)</span>
                                    </label>
                                    <textarea
                                        id={noteId}
                                        rows={3}
                                        placeholder="Add a short note for the user..."
                                        value={note}
                                        onChange={(event) => setReviewNotes((current) => ({
                                            ...current,
                                            [request._id]: event.target.value,
                                        }))}
                                        maxLength={NOTE_LIMIT}
                                    />
                                    <span className="rr-card__counter">{note.length}/{NOTE_LIMIT}</span>
                                </div>

                                <div className="rr-card__actions">
                                    <button
                                        type="button"
                                        className="dbtn dbtn--danger"
                                        onClick={() => decide(request, "rejected")}
                                        disabled={Boolean(busyId)}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        className="dbtn dbtn--good"
                                        onClick={() => decide(request, "approved")}
                                        disabled={Boolean(busyId)}
                                    >
                                        {busyId === request._id ? "Saving..." : "Approve"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
