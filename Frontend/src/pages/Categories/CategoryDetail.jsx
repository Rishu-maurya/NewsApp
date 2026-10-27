import { Link, useParams } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import ArticleCard from '../../components/news/ArticleCard';
import { useArticles } from '../../context/ArticlesContext';
import { CATEGORIES } from '../../data/dummyData';
import { isLive } from '../../utils/dateUtils';
import NotFound from '../NotFound/NotFound';
import '../../style/CategoryDetail.css';

export default function CategoryDetail({ session, onLogout }) {
    const { category: categoryParam } = useParams();
    const category = CATEGORIES.find(
        (item) => item.toLowerCase() === categoryParam?.toLowerCase()
    );
    const { articles } = useArticles();

    if (!category) return <NotFound session={session} onLogout={onLogout} />;

    const stories = articles.filter((article) => article.category === category && isLive(article));

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <div className="s-category-detail">
                <Link to="/categories" className="s-back">All categories</Link>
                <section className="s-page-intro">
                    <p className="s-eyebrow">Category</p>
                    <h1 className="s-h1">{category}</h1>
                    <p className="s-sub">
                        {stories.length
                            ? `${stories.length} ${stories.length === 1 ? 'story' : 'stories'} in ${category}.`
                            : `There are no published ${category.toLowerCase()} stories yet.`}
                    </p>
                </section>

                {stories.length ? (
                    <div className="s-grid">
                        {stories.map((article) => (
                            <ArticleCard key={article.id} article={article} session={session} />
                        ))}
                    </div>
                ) : (
                    <div className="s-empty">
                        <p>New stories will appear here after editorial review.</p>
                        <Link to="/categories" className="s-btn">Explore other categories</Link>
                    </div>
                )}
            </div>
        </SiteLayout>
    );
}
