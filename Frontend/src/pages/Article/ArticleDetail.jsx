import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import ReactionBar from '../../components/news/ReactionBar';
import CommentSection from '../../components/news/CommentSection';
import { getPublishedArticle } from '../../services/articleService';
import '../../style/ArticleDetail.css';

export default function ArticleDetail({ session, onLogout }) {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        getPublishedArticle(id)
            .then((result) => {
                if (!cancelled) setArticle(result);
            })
            .catch((err) => {
                if (!cancelled) {
                    setArticle(null);
                    setError(err.message);
                }
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
                    <p className="s-muted">Loading story...</p>
                ) : article ? (
                    <>
                        <p className="s-cat">{article.category}</p>
                        <h1 className="s-h1">{article.title}</h1>
                        <p className="s-meta">
                            <span>{article.author}</span>
                            <span>{article.date}</span>
                        </p>

                        <p className="s-article__body" style={{ whiteSpace: 'pre-line' }}>
                            {article.body}
                        </p>

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
                        <p>{error || 'This story could not be found.'}</p>
                    </div>
                )}
            </div>
        </SiteLayout>
    );
}