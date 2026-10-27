import '../../style/AuthLayout.css';

const STEPS = [
    { title: 'Draft', text: 'Journalists write the story', key: 'draft' },
    { title: 'In review', text: 'Editors check every claim', key: 'review' },
    { title: 'Published', text: 'Readers get verified news', key: 'published' },
];

export default function AuthLayout({ title, subtitle, children, footer, variant }) {
    return (
        <div className={`login${variant ? ` login--${variant}` : ''}`}>
            <aside className="login__panel">
                <div className="login__brand">News Platform</div>
                <div className="login__story">
                    <h2 className="login__headline">Every story is checked before it is published.</h2>
                    <ol className="flow">
                        {STEPS.map((step) => (
                            <li key={step.title} className={`flow__step flow__step--${step.key}`}>
                                <strong>{step.title}</strong>
                                <span>{step.text}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </aside>

            <main className="login__main">
                <div className="card">
                    <h1>{title}</h1>
                    <p className="card__sub">{subtitle}</p>
                    {children}
                    {footer && <p className="card__foot">{footer}</p>}
                </div>
            </main>
        </div>
    );
}