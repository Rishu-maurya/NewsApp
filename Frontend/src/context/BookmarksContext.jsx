import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { addBookmark, getMyBookmarks, removeBookmark } from '../services/bookmarkService';

const BookmarksContext = createContext({
    items: [],
    ids: new Set(),
    loading: false,
    error: '',
    toggle: async () => '',
});

// Keeps the logged-in user's bookmarks (from the server) in one place,
// so every Save button, the Bookmarks page and the navbar count agree.
export function BookmarksProvider({ session, children }) {
    const token = session?.token;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const refresh = useCallback(async () => {
        if (!token) {
            setItems([]);
            return;
        }
        setLoading(true);
        setError('');
        try {
            setItems(await getMyBookmarks());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const ids = useMemo(() => new Set(items.map((item) => item.id)), [items]);

    // Save or un-save a story. Returns an error message, or '' when it worked.
    const toggle = async (articleId) => {
        const id = String(articleId);
        try {
            if (ids.has(id)) {
                await removeBookmark(id);
                setItems((prev) => prev.filter((item) => item.id !== id));
            } else {
                await addBookmark(id);
                await refresh();
            }
            return '';
        } catch (err) {
            return err.message;
        }
    };

    return (
        <BookmarksContext.Provider value={{ items, ids, loading, error, toggle }}>
            {children}
        </BookmarksContext.Provider>
    );
}

export function useBookmarks() {
    return useContext(BookmarksContext);
}
