import { Link } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import ArticleCard from '../../components/news/ArticleCard';
import LoginPrompt from '../../components/news/LoginPrompt';
import { useBookmarks } from '../../context/BookmarksContext';
import '../../style/Bookmarks.css';

export default function Bookmarks({ session, onLogout }) {
    const { items: serverItems, loading, error } = useBookmarks();

    if (!session) {
        return (
            <SiteLayout session={session} onLogout={onLogout}>
                <h1 className="s-h1">Bookmarks</h1>
                <p className="s-sub">Keep the stories you want to read later.</p>
                <LoginPrompt message="Log in to see the stories you saved." />
            </SiteLayout>
        );
    }

    const list = serverItems;

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <div className="s-bookmarks">
                <h1 className="s-h1">Bookmarks</h1>
                <p className="s-sub">
                    {list.length === 0
                        ? 'Stories you save will appear here.'
                        : `${list.length} saved ${list.length === 1 ? 'story' : 'stories'}`}
                </p>

                {error && <p className="s-err" role="alert">{error}</p>}
                {loading && list.length === 0 ? (
                    <p className="s-sub">Loading your saved stories...</p>
                ) : list.length === 0 ? (
                    <div className="s-empty">
                        <p>You have not saved any stories yet. Press Save on a story to keep it here.</p>
                        <Link to="/" className="s-btn s-btn--solid">Browse news</Link>
                    </div>
                ) : (
                    <div className="s-grid">
                        {list.map((a) => (
                            <ArticleCard key={a.id} article={a} session={session} removable />
                        ))}
                    </div>
                )}
            </div>
        </SiteLayout>
    );
}