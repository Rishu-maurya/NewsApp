import { useNavigate } from 'react-router-dom';
import { useActivity } from '../../context/ActivityContext';
import { useBookmarks } from '../../context/BookmarksContext';
import { isServerId } from '../../services/bookmarkService';
import '../../style/ReactionBar.css';

export default function ReactionBar({ articleId, session }) {
    const navigate = useNavigate();
    const { likes, saved, comments, toggleLike, toggleSave } = useActivity();
    const { ids, toggle } = useBookmarks();

    const email = session?.user.email;
    const key = String(articleId);
    const likeList = likes[key] || [];
    const commentCount = comments.filter((c) => c.targetId === key).length;
    const isLiked = email ? likeList.includes(email) : false;
    const onServer = isServerId(articleId);
    const isSaved = !email ? false : onServer ? ids.has(key) : (saved[key] || []).includes(email);

    const handleSave = async () => {
        if (!onServer) {
            toggleSave(articleId, email);
            return;
        }
        const problem = await toggle(articleId);
        if (problem) window.alert(problem);
    };

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
                onClick={() => (email ? handleSave() : goLogin())}
            >
                {isSaved ? 'Saved' : 'Save'}
            </button>
            <a href="#comments" className="s-btn">Comment ({commentCount})</a>
        </div>
    );
}