import './BreakingTicker.css';

/**
 * Breaking-news ticker.
 *
 * items : [{ id, title, to?, href? }]
 * as    : optional link component (pass react-router's <Link> as `as={Link}`
 *         and each item then uses its `to`; otherwise a plain <a href> is used)
 */
export default function BreakingTicker({ items = [], label = 'Breaking', as: LinkTag }) {
    if (!items.length) return null;

    const Tag = LinkTag || 'a';
    const loop = [...items, ...items]; // duplicated so the loop never shows a gap

    return (
        <div className="s-ticker" role="region" aria-label="Breaking news">
            <span className="s-ticker__label">
                <i className="s-ticker__dot" aria-hidden="true" />
                {label}
            </span>
            <div className="s-ticker__viewport">
                <ul className="s-ticker__track">
                    {loop.map((item, i) => {
                        const isCopy = i >= items.length;
                        const linkProps = LinkTag ? { to: item.to } : { href: item.href };
                        return (
                            <li key={`${item.id ?? i}-${i}`} aria-hidden={isCopy || undefined}>
                                <Tag
                                    className="s-ticker__item"
                                    tabIndex={isCopy ? -1 : undefined}
                                    {...linkProps}
                                >
                                    {item.title}
                                </Tag>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
