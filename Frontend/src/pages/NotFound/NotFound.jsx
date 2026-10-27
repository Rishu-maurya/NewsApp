import { Link } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import '../../style/NotFound.css';

export default function NotFound({ session, onLogout }) {
    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <div className="s-empty s-not-found">
                <p className="s-eyebrow">404 · Page not found</p>
                <h1 className="s-h1">This page is off the record.</h1>
                <p>It may have moved, or the address might be incorrect.</p>
                <Link to="/" className="s-btn s-btn--solid">Back to latest news</Link>
            </div>
        </SiteLayout>
    );
}
