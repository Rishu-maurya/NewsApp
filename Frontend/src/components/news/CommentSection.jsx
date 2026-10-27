import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActivity } from '../../context/ActivityContext';
import LoginPrompt from './LoginPrompt';
import '../../style/CommentSection.css';

export default function CommentSection({ targetId, session, heading = 'Comments' }) {
    const { comments, addComment, deleteComment } = useActivity();
    const [text, setText] = useState('');
    const [error, setError] = useState('');

    const list = comments.filter((c) => c.targetId === String(targetId));

    if (!session) {
        return (
            <section className="s-block">
                <h2 className="s-h2">{heading} ({list.length})</h2>
                <LoginPrompt message="Log in to read and write comments." />
            </section>
        );
    }

    const user = session.user;

    const submit = (e) => {
        e.preventDefault();
        const clean = text.trim();
        if (!clean) return setError('Write a comment before posting.');
        if (clean.length > 300) return setError('Keep the comment under 300 characters.');
        addComment(targetId, user, clean);
        setText('');
        setError('');
    };

    return (
        <section className="s-block">
            <h2 className="s-h2">{heading} ({list.length})</h2>

            <form onSubmit={submit} noValidate>
                {error && <p className="s-err" role="alert">{error}</p>}
                <label htmlFor={`c-${targetId}`} className="s-label">
                    Add a comment as {user.name}
                </label>
                <textarea
                    id={`c-${targetId}`}
                    className="s-textarea"
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        setError('');
                    }}
                    placeholder="Share your thoughts"
                />
                <button type="submit" className="s-btn s-btn--solid">Post comment</button>
            </form>

            {list.length === 0 ? (
                <p className="s-muted">No comments yet. Be the first to write one.</p>
            ) : (
                <ul className="s-comments">
                    {list.map((c) => (
                        <li key={c.id} className="s-comment">
                            <p className="s-comment__head">
                                <strong>{c.name}</strong>
                                <span>{c.date}</span>
                            </p>
                            <p className="s-comment__text">{c.text}</p>
                            {(c.email === user.email || user.role === 'admin') && (
                                <button type="button" className="s-link-btn" onClick={() => deleteComment(c.id)}>
                                    Delete
                                </button>
                            )}
                            {c.email !== user.email && (
                                <Link
                                    className="s-link-btn s-link-btn--report"
                                    to="/report"
                                    state={{ articleId: targetId, commentId: c.id }}
                                >
                                    Report
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}