import { Link } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import LoginPrompt from '../../components/news/LoginPrompt';
import { useActivity } from '../../context/ActivityContext';
import { useArticles } from '../../context/ArticlesContext';
import { isLive } from '../../utils/dateUtils';
import '../../style/Profile.css';
import '../../style/InfoCard.css';

export default function Profile({ session, onLogout }) {
    const { articles } = useArticles();
    const { feedback, comments, saved } = useActivity();

    if (!session) {
        return (
            <SiteLayout session={session} onLogout={onLogout}>
                <h1 className="s-h1">Your profile</h1>
                <p className="s-sub">Sign in to see your account details and activity.</p>
                <LoginPrompt message="Log in to view your profile." />
            </SiteLayout>
        );
    }

    const { user } = session;
    const commentCount = comments.filter((comment) => comment.email === user.email).length;
    const feedbackCount = feedback.filter((item) => item.email === user.email).length;
    const bookmarkCount = articles.filter(
        (article) => isLive(article) && (saved[String(article.id)] || []).includes(user.email)
    ).length;

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <section className="s-page-intro">
                <p className="s-eyebrow">Account</p>
                <h1 className="s-h1">Your profile</h1>
                <p className="s-sub">Your account information and activity on News Platform.</p>
            </section>

            <div className="s-profile-layout">
                <section className="s-info-card">
                    <h2 className="s-h2">Account details</h2>
                    <dl className="s-profile-details">
                        <div><dt>Name</dt><dd>{user.name}</dd></div>
                        <div><dt>Email</dt><dd>{user.email}</dd></div>
                        <div><dt>Account type</dt><dd className="s-role">{user.role}</dd></div>
                    </dl>
                    <p className="s-muted">
                        Profile editing is not connected yet. These details come from your sign-in session.
                    </p>
                </section>

                <section className="s-info-card">
                    <h2 className="s-h2">Your activity</h2>
                    <div className="s-profile-stats">
                        <Link to="/bookmarks"><strong>{bookmarkCount}</strong><span>Bookmarks</span></Link>
                        <div><strong>{commentCount}</strong><span>Comments</span></div>
                        <Link to="/feedback"><strong>{feedbackCount}</strong><span>Feedback entries</span></Link>
                    </div>
                </section>
            </div>
        </SiteLayout>
    );
}
