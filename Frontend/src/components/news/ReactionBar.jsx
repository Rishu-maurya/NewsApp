import { useNavigate } from 'react-router-dom';
import { useActivity } from '../../context/ActivityContext';
import '../../style/ReactionBar.css';

export default function ReactionBar({ articleId, session }) {
    const navigate = useNavigate();
    const { likes, saved, toggleLike, toggleSave } = useActivity();

    const email = session?.user.email;
    const key = String(articleId);
    const likeList = likes[key] || [];
    const isLiked = email ? likeList.includes(email) : false;
    const isSaved = email ? (saved[key] || []).includes(email) : false;

    const goLogin = () =>
        navigate('/login', { state: { message: 'Log in to like and save stories.' } });

    return (
        <div className="s-row s-reaction-bar">
            <button
                type="button"
                className="s-btn"
                aria-pressed={isLiked}
                onClick={() => (email ? toggleLike(articleId, email) : goLogin())}
            >
                {isLiked ? 'Liked' : 'Like'} ({likeList.length})
            </button>
            <button
                type="button"
                className="s-btn"
                aria-pressed={isSaved}
                onClick={() => (email ? toggleSave(articleId, email) : goLogin())}
            >
                {isSaved ? 'Saved' : 'Save'}
            </button>
        </div>
    );
}