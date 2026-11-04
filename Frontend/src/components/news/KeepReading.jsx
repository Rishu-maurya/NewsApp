import { Link } from 'react-router-dom';
import { bodyToText, readMinutes } from '../../utils/richText';
import '../../style/Engage.css';

// "Keep reading" strip at the end of a story: same category first, then the newest.
export default function KeepReading({ current, stories }) {
    const others = stories.filter((a) => a.id !== current.id);
    const same = others.filter((a) => a.category === current.category);
    const rest = others.filter((a) => a.category !== current.category);
    const picks = [...same, ...rest].slice(0, 3);

    if (picks.length === 0) return null;

    return (
        <section className="s-next" aria-labelledby="keep-reading">
            <h2 className="s-h2" id="keep-reading">Keep reading</h2>
            <div className="s-next__grid">
                {picks.map((a) => (
                    <Link key={a.id} to={`/article/${a.id}`} className="s-next__card" data-cat={a.category}>
                        <span className="s-next__cat">{a.category}</span>
                        <strong className="s-next__title">{a.title}</strong>
                        <span className="s-next__text">{bodyToText(a.body).slice(0, 90)}...</span>
                        <span className="s-next__meta">{readMinutes(a.body)} min read &rarr;</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
