import { useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import { ArticlesProvider } from './context/ArticlesContext';
import { ActivityProvider } from './context/ActivityContext';
import { BookmarksProvider } from './context/BookmarksContext';
import { NewsProvider } from './context/NewsContext';
import { getSession, clearSession } from './services/authService';
import useSessionCheck from './hooks/useSessionCheck';

export default function App() {
  const [session, setSession] = useState(getSession());

  useSessionCheck(session, setSession);

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  return (
    <ArticlesProvider>
      <ActivityProvider>
        <BookmarksProvider session={session}>
          <NewsProvider>
            <AppRoutes session={session} onLogin={setSession} onLogout={handleLogout} />
          </NewsProvider>
        </BookmarksProvider>
      </ActivityProvider>
    </ArticlesProvider>
  );
}