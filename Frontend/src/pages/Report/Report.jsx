import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import LoginPrompt from '../../components/news/LoginPrompt';
import { useActivity } from '../../context/ActivityContext';
import { useArticles } from '../../context/ArticlesContext';
import { LIVE_STREAMS } from '../../data/liveData';
import { isLive } from '../../utils/dateUtils';
import '../../style/Report.css';
import '../../style/ArticleDetail.css';

const REASONS = ['Misleading or inaccurate', 'Spam or scam', 'Abusive or harmful', 'Copyright concern', 'Other'];

export default function Report({ session, onLogout }) {
    const location = useLocation();
    const { articles } = useArticles();
    const { comments, addReport } = useActivity();
    const initialCommentId = location.state?.commentId ? String(location.state.commentId) : '';
    const initialTargetId = String(location.state?.articleId || '');
    const [targetId, setTargetId] = useState(initialTargetId);
    const [commentId, setCommentId] = useState(initialCommentId);
    const [reason, setReason] = useState(REASONS[0]);
    const [details, setDetails] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const targets = [
        ...articles.filter(isLive).map((article) => ({
            id: String(article.id),
            title: article.title,
            type: 'story',
        })),
        ...LIVE_STREAMS.map((stream) => ({
            id: stream.id,
            title: stream.title,
            type: 'live video',
        })),
    ];
    const target = targets.find((item) => item.id === targetId);
    const reportedComment = comments.find(
        (comment) => comment.id === Number(commentId) && comment.targetId === targetId
    );

    if (!session) {
        return (
            <SiteLayout session={session} onLogout={onLogout}>
                <h1 className="s-h1">Report content</h1>
                <p className="s-sub">Help our team review content that may need attention.</p>
                <LoginPrompt message="Log in to report a story or comment." />
            </SiteLayout>
        );
    }

    const submit = (event) => {
        event.preventDefault();
        if (!target) {
            setError('Choose the story or live video you want to report.');
            return;
        }
        if (commentId && !reportedComment) {
            setError('That comment is no longer available. Choose the story or video to report instead.');
            return;
        }
        if (details.trim().length < 10) {
            setError('Add at least 10 characters so the newsroom can review your report.');
            return;
        }

        const commentText = reportedComment
            ? `Reported comment: "${reportedComment.text}"\n\nDetails: ${details.trim()}`
            : `Content report: ${details.trim()}`;
        addReport({
            article: target.title,
            comment: commentText,
            reason,
            reportedBy: session.user.name,
            reporterEmail: session.user.email,
        });
        setSubmitted(true);
        setError('');
        setDetails('');
    };

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <div className="s-article s-report">
                <Link to="/" className="s-back">Back to news</Link>
                <h1 className="s-h1">Report content</h1>
                <p className="s-sub">Reports go to the newsroom team for review.</p>

                {submitted ? (
                    <div className="s-note" role="status">
                        Thank you. Your report was added to the review queue.
                        <p><Link to="/">Return to the news feed</Link></p>
                        <button type="button" className="s-btn" onClick={() => setSubmitted(false)}>
                            Submit another report
                        </button>
                    </div>
                ) : (
                    <form className="s-form" onSubmit={submit} noValidate>
                        {error && <p className="s-err" role="alert">{error}</p>}

                        <label className="s-label" htmlFor="report-target">Story or live video</label>
                        <select
                            id="report-target"
                            className="s-select"
                            value={targetId}
                            onChange={(event) => {
                                setTargetId(event.target.value);
                                setCommentId('');
                                setError('');
                            }}
                            required
                        >
                            <option value="">Choose content</option>
                            {targets.map((item) => (
                                <option key={`${item.type}-${item.id}`} value={item.id}>
                                    {item.title} ({item.type})
                                </option>
                            ))}
                        </select>

                        {target && (
                            <>
                                <label className="s-label" htmlFor="report-comment">Specific comment (optional)</label>
                                <select
                                    id="report-comment"
                                    className="s-select"
                                    value={commentId}
                                    onChange={(event) => {
                                        setCommentId(event.target.value);
                                        setError('');
                                    }}
                                >
                                    <option value="">Report the story or video</option>
                                    {comments
                                        .filter((comment) => comment.targetId === targetId)
                                        .map((comment) => (
                                            <option key={comment.id} value={comment.id}>
                                                {comment.name}: {comment.text.slice(0, 70)}
                                            </option>
                                        ))}
                                </select>
                            </>
                        )}

                        <label className="s-label" htmlFor="report-reason">Reason</label>
                        <select
                            id="report-reason"
                            className="s-select"
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                        >
                            {REASONS.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>

                        <label className="s-label" htmlFor="report-details">What should we know?</label>
                        <textarea
                            id="report-details"
                            className="s-textarea"
                            value={details}
                            onChange={(event) => {
                                setDetails(event.target.value);
                                setError('');
                            }}
                            minLength={10}
                            maxLength={1000}
                            placeholder="Describe the issue so our team can review it."
                            required
                        />
                        <button type="submit" className="s-btn s-btn--solid">Send report</button>
                    </form>
                )}
            </div>
        </SiteLayout>
    );
}
