import { Link, useParams } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import ReactionBar from '../../components/news/ReactionBar';
import CommentSection from '../../components/news/CommentSection';
import { useArticles } from '../../context/ArticlesContext';
import { dayName, isLive } from '../../utils/dateUtils';
import KeepReading from '../../components/news/KeepReading';
import { bodyToHtml, bodyToText, readMinutes, wordCount } from '../../utils/richText';
import '../../style/ArticleDetail.css';
import '../../style/Newspaper.css';

export default function ArticleDetail({ session, onLogout }) {
    const { id } = useParams();
    const { articles } = useArticles();
    const article = articles.find((a) => String(a.id) === id && isLive(a));

    // newspaper layout: longer stories get more columns
    const words = article ? wordCount(article.body) : 0;
    const columns = words >= 160 ? 3 : words >= 60 ? 2 : 1;
    const dropCap = article ? /^[A-Za-z]/.test(bodyToText(article.body)) : false;

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            {article ? (
                <>
                    <article className="s-paper">
                        <Link to="/" className="s-back">All stories</Link>

                        <header className="s-paper__head">
                            <p className="s-paper__kicker" data-cat={article.category}>{article.category}</p>
                            <h1 className="s-paper__title">{article.title}</h1>
                            <p className="s-paper__byline">
                                <span>By {article.author}</span>
                                <span>{dayName(article.date)}, {article.date}</span>
                                <span>{readMinutes(article.body)} min read</span>
                            </p>
                        </header>

                        {/* plain text becomes paragraphs; formatted text from the editor is sanitized */}
                        <div
                            className={`s-paper__body s-paper__body--cols-${columns}${dropCap ? ' s-paper__body--dropcap' : ''}`}
                            dangerouslySetInnerHTML={{ __html: bodyToHtml(article.body) }}
                        />
                    </article>

                    <div className="s-article">
                        <Link
                            to="/report"
                            state={{ articleId: article.id }}
                            className="s-link-btn"
                        >
                            Report this story
                        </Link>
                        <ReactionBar articleId={article.id} session={session} />
                        <CommentSection targetId={article.id} session={session} />
                    </div>

                    <KeepReading current={article} stories={articles.filter((a) => isLive(a))} />
                </>
            ) : (
                <div className="s-article">
                    <Link to="/" className="s-back">All stories</Link>
                    <div className="s-empty">
                        <p>This story could not be found. It may have been removed.</p>
                    </div>
                </div>
            )}
        </SiteLayout>
    );
}
