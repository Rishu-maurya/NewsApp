import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useActivity } from '../../context/ActivityContext';
import '../../style/CommentSection.css';

export default function CommentSection({ targetId, session, heading = 'Comments' }) {
    const { comments, addComment, deleteComment } = useActivity();
    const location = useLocation();
    const user = session?.user;
    const [text, setText] = useState('');
    const [guestName, setGuestName] = useState('');
    const [error, setError] = useState('');

    const list = comments.filter((c) => c.targetId === String(targetId));

    // opened from the "Comment" button on a story card: /article/1#comments
    useEffect(() => {
        if (location.hash === '#comments') {
            document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [location.hash]);

    const submit = (e) => {
        e.preventDefault();
        const clean = text.trim();
        const author = user || { name: guestName.trim(), email: '' };

        if (!user && author.name.length < 2) return setError('Enter your name (at least 2 characters).');
        if (!user && author.name.length > 40) return setError('Keep your name under 40 characters.');
        if (!clean) return setError('Write a comment before posting.');
        if (clean.length > 300) return setError('Keep the comment under 300 characters.');

        addComment(targetId, author, clean);
        setText('');
        setError('');
    };

    return (
        <section className="s-block s-comments-block" id="comments">
            <h2 className="s-h2">{heading} ({list.length})</h2>

            <form className="s-comment-form" onSubmit={submit} noValidate>
                {error && <p className="s-err" role="alert">{error}</p>}

                {user ? (
                    <label htmlFor={`c-${targetId}`} className="s-label">
                        Add a comment as {user.name}
                    </label>
                ) : (
                    <>
                        <label htmlFor={`cn-${targetId}`} className="s-label">Your name</label>
                        <input
                            id={`cn-${targetId}`}
                            className="s-input"
                            type="text"
                            autoComplete="name"
                            maxLength={40}
                            value={guestName}
                            onChange={(e) => {
                                setGuestName(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter your name"
                        />
                        <label htmlFor={`c-${targetId}`} className="s-label">Your comment</label>
                    </>
                )}

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

                {!user && (
                    <p className="s-muted">
                        You are commenting as a guest. <Link to="/login">Log in</Link> to comment with your account.
                    </p>
                )}
            </form>

            {list.length === 0 ? (
                <p className="s-muted">No comments yet. Be the first to write one.</p>
            ) : (
                <ul className="s-comments">
                    {list.map((c) => (
                        <li key={c.id} className="s-comment">
                            <p className="s-comment__head">
                                <span className="s-comment__who">
                                    <strong>{c.name}</strong>
                                    {!c.email && <span className="s-comment__guest">Guest</span>}
                                </span>
                                <span>{c.date}</span>
                            </p>
                            <p className="s-comment__text">{c.text}</p>
                            {user && (c.email === user.email || user.role === 'admin') && (
                                <button type="button" className="s-link-btn" onClick={() => deleteComment(c.id)}>
                                    Delete
                                </button>
                            )}
                            {user && c.email !== user.email && (
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