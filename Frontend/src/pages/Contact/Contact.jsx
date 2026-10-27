import { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '../../components/layout/SiteLayout';
import '../../style/Contact.css';
import '../../style/InfoCard.css';

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL;

export default function Contact({ session, onLogout }) {
    const [form, setForm] = useState({ name: session?.user.name || '', subject: '', message: '' });
    const [status, setStatus] = useState('');

    const submit = (event) => {
        event.preventDefault();
        if (!CONTACT_EMAIL) return;

        const subject = encodeURIComponent(form.subject.trim());
        const body = encodeURIComponent(
            `From: ${form.name.trim()}\n\n${form.message.trim()}`
        );
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
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

            <div className="s-contact-layout">
                <section className="s-info-card">
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

                <section className="s-info-card">
                    <h2 className="s-h2">Write to us</h2>
                    {CONTACT_EMAIL ? (
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
                    ) : (
                        <div className="s-empty s-empty--compact">
                            <p>The newsroom email is not configured for this app yet.</p>
                            <p className="s-muted">
                                Set <code>VITE_CONTACT_EMAIL</code> in the frontend environment to enable this form.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </SiteLayout>
    );
}
