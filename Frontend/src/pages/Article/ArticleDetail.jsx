import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import ReactionBar from '../../components/news/ReactionBar';
import CommentSection from '../../components/news/CommentSection';
import { getPublishedArticle, isServerId } from '../../services/bookmarkService';
import '../../style/ArticleDetail.css';

export default function ArticleDetail({ session, onLogout }) {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(isServerId(id));

    // Load the full story from the server (GET /api/articles/:id)
    useEffect(() => {
        if (!isServerId(id)) {
            setArticle(null);
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        getPublishedArticle(id)
            .then((story) => {
                if (!cancelled) setArticle(story);
            })
            .catch(() => {
                if (!cancelled) setArticle(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <div className="s-article">
                <Link to="/" className="s-back">All stories</Link>

                {loading ? (
                    <p className="s-sub">Loading story...</p>
                ) : article ? (
                    <>
                        <p className="s-cat">{article.category}</p>
                        <h1 className="s-h1">{article.title}</h1>
                        <p className="s-meta">
                            <span>{article.author}</span>
                            <span>{article.date}</span>
                        </p>

                        <p className="s-article__body">{article.body}</p>

                        <Link
                            to="/report"
                            state={{ articleId: article.id }}
                            className="s-link-btn"
                        >
                            Report this story
                        </Link>
                        <ReactionBar articleId={article.id} session={session} />
                        <CommentSection targetId={article.id} session={session} />
                    </>
                ) : (
                    <div className="s-empty">
                        <p>This story could not be found. It may have been removed.</p>
                    </div>
                )}
            </div>
        </SiteLayout>
    );
}
