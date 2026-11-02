import { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import '../../style/Contact.css';
import '../../style/InfoCard.css';

// Sample details: change these to your real newsroom details.
const CONTACT = {
    email: import.meta.env.VITE_CONTACT_EMAIL || 'contact@newsplatform.com',
    phone: '+91 98765 43210',
    address: ['News Platform Newsroom', 'Main Road, Maharashtra', 'India'],
    hours: 'Mon - Sat, 9:00 AM - 6:00 PM',
};

function Icon({ children }) {
    return (
        <span className="s-contact-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {children}
            </svg>
        </span>
    );
}

export default function Contact({ session, onLogout }) {
    const [form, setForm] = useState({ name: session?.user.name || '', subject: '', message: '' });
    const [status, setStatus] = useState('');

    const submit = (event) => {
        event.preventDefault();

        const subject = encodeURIComponent(form.subject.trim());
        const body = encodeURIComponent(
            `From: ${form.name.trim()}\n\n${form.message.trim()}`
        );
        window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
        setStatus('Your email app should open with this message. The website has not sent it.');
    };

    const update = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
        setStatus('');
    };

    return (
        <SiteLayout session={session} onLogout={onLogout}>
            <section className="s-page-intro">
                <p className="s-eyebrow">Get in touch</p>
                <h1 className="s-h1">Contact the newsroom</h1>
                <p className="s-sub">Send a question, share a correction or tell us what you think.</p>
            </section>

            <div className="s-info-grid s-contact-cards">
                <article className="s-info-card">
                    <Icon>
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <path d="m3 7 9 6 9-6" />
                    </Icon>
                    <h2 className="s-h2">Email us</h2>
                    <p>For story tips, corrections and general questions.</p>
                    <a className="s-contact-link" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                </article>

                <article className="s-info-card">
                    <Icon>
                        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
                    </Icon>
                    <h2 className="s-h2">Call us</h2>
                    <p>Talk to the newsroom desk during working hours.</p>
                    <a className="s-contact-link" href={`tel:${CONTACT.phone.replace(/[^\d+]/g, '')}`}>
                        {CONTACT.phone}
                    </a>
                </article>

                <article className="s-info-card">
                    <Icon>
                        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                    </Icon>
                    <h2 className="s-h2">Visit us</h2>
                    <address className="s-contact-address">
                        {CONTACT.address.map((line) => (
                            <span key={line}>{line}</span>
                        ))}
                    </address>
                    <p className="s-contact-hours">{CONTACT.hours}</p>
                </article>
            </div>

            <div className="s-contact-layout">
                <section className="s-info-card s-contact-form-card">
                    <h2 className="s-h2">Write to us</h2>
                    <form className="s-form" onSubmit={submit}>
                        {status && <p className="s-note" role="status">{status}</p>}
                        <label className="s-label" htmlFor="contact-name">Your name</label>
                        <input
                            className="s-input s-input--wide"
                            id="contact-name"
                            name="name"
                            autoComplete="name"
                            value={form.name}
                            onChange={update}
                            required
                        />
                        <label className="s-label" htmlFor="contact-subject">Subject</label>
                        <input
                            className="s-input s-input--wide"
                            id="contact-subject"
                            name="subject"
                            value={form.subject}
                            onChange={update}
                            required
                            maxLength={120}
                        />
                        <label className="s-label" htmlFor="contact-message">Message</label>
                        <textarea
                            className="s-textarea"
                            id="contact-message"
                            name="message"
                            value={form.message}
                            onChange={update}
                            required
                            minLength={10}
                            maxLength={2000}
                            rows={6}
                        />
                        <button className="s-btn s-btn--solid" type="submit">Open email app</button>
                        <p className="s-muted s-form__hint">
                            This opens your default email app. Your message is not sent by this website.
                        </p>
                    </form>
                </section>

                <section className="s-info-card s-contact-form-card">
                    <h2 className="s-h2">What can we help with?</h2>
                    <ul className="s-contact-list">
                        <li><strong>Story tips</strong><span>Share a lead or a local issue we should look into.</span></li>
                        <li><strong>Corrections</strong><span>Point out a detail that needs another look.</span></li>
                        <li><strong>Platform feedback</strong><span>Tell us how to improve your reading experience.</span></li>
                    </ul>
                    <p className="s-muted">
                        For general product feedback, you can also use the <Link to="/feedback">feedback page</Link>.
                    </p>
                </section>
            </div>
        </SiteLayout>
    );
}