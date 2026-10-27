import { Link } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import '../../style/About.css';
import '../../style/InfoCard.css';

export default function About({ session, onLogout }) {
    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <section className="s-page-intro s-about">
                <p className="s-eyebrow">About us</p>
                <h1 className="s-h1">News made with care.</h1>
                <p className="s-sub">
                    We make it easier to follow the stories that matter in your community.
                </p>
            </section>

            <div className="s-info-grid">
                <article className="s-info-card">
                    <span className="s-info-card__number">01</span>
                    <h2 className="s-h2">Accuracy first</h2>
                    <p>Every story is reviewed by an editor before it appears in the news feed.</p>
                </article>
                <article className="s-info-card">
                    <span className="s-info-card__number">02</span>
                    <h2 className="s-h2">Local perspective</h2>
                    <p>Our newsroom covers city updates, sports, technology, business, health and culture.</p>
                </article>
                <article className="s-info-card">
                    <span className="s-info-card__number">03</span>
                    <h2 className="s-h2">A thoughtful community</h2>
                    <p>Readers can save stories, join the discussion and share feedback with the newsroom.</p>
                </article>
            </div>

            <section className="s-callout">
                <div>
                    <h2 className="s-h2">Help us do better</h2>
                    <p className="s-muted">Have a suggestion about the site or our coverage?</p>
                </div>
                <Link to="/contact" className="s-btn s-btn--solid">Contact the newsroom</Link>
            </section>
        </SiteLayout>
    );
}
