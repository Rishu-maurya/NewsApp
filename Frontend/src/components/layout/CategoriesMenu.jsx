import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { CATEGORIES } from '../../data/dummyData';
import { useArticles } from '../../context/ArticlesContext';
import { isLive } from '../../utils/dateUtils';
import '../../style/Categories.css';

const MENU_WIDTH = 300;

export default function CategoriesMenu() {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const menuRef = useRef(null);
    const { pathname } = useLocation();
    const { articles } = useArticles();

    const isActive = pathname.startsWith('/categories') || pathname.startsWith('/category/');

    const items = CATEGORIES.map((name) => ({
        name,
        count: articles.filter((a) => a.category === name && isLive(a)).length,
    }));

    const place = () => {
        const rect = buttonRef.current.getBoundingClientRect();
        const left = Math.min(Math.max(12, rect.left), window.innerWidth - MENU_WIDTH - 12);
        setPos({ top: rect.bottom + 8, left });
    };

    const toggle = () => {
        if (!open) place();
        setOpen((value) => !value);
    };

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!open) return undefined;

        const onPointerDown = (e) => {
            const insideMenu = menuRef.current?.contains(e.target);
            const onButton = buttonRef.current?.contains(e.target);
            if (!insideMenu && !onButton) setOpen(false);
        };
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };
        const close = () => setOpen(false);

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        window.addEventListener('resize', close);
        window.addEventListener('scroll', close, { passive: true });

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('resize', close);
            window.removeEventListener('scroll', close);
        };
    }, [open]);

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className={`s-link s-link--menu${isActive ? ' is-active' : ''}${open ? ' is-open' : ''}`}
                aria-haspopup="true"
                aria-expanded={open}
                aria-controls="categories-menu"
                onClick={toggle}
            >
                Categories
                <span className="s-link__chev" aria-hidden="true" />
            </button>

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        id="categories-menu"
                        className="cat-menu"
                        style={{ top: pos.top, left: pos.left }}
                    >
                        <p className="cat-menu__label">Browse by category</p>

                        <ul className="cat-menu__list">
                            {items.map((item, i) => (
                                <li key={item.name} style={{ '--i': i }}>
                                    <Link
                                        to={`/category/${encodeURIComponent(item.name.toLowerCase())}`}
                                        className="cat-menu__item"
                                        onClick={() => setOpen(false)}
                                    >
                                        <span>{item.name}</span>
                                        <span className="cat-menu__count">{item.count}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <Link to="/categories" className="cat-menu__all" onClick={() => setOpen(false)}>
                            View all categories <span aria-hidden="true">→</span>
                        </Link>
                    </div>,
                    document.body
                )}
        </>
    );
}