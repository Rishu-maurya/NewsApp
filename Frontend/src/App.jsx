import { useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import { ArticlesProvider } from './context/ArticlesContext';
import { ActivityProvider } from './context/ActivityContext';
import { BookmarksProvider } from './context/BookmarksContext';
import { NewsProvider } from './context/NewsContext';
import { getSession, clearSession } from './services/authService';
import useSessionCheck from './hooks/useSessionCheck';
import useRoleAlerts from './hooks/useRoleAlerts';
import { AlertProvider } from './context/AlertContext';
import { SESSION_EXPIRED_EVENT } from './services/axiosInstance';

function AppContent() {
  const [session, setSession] = useState(getSession());

  useSessionCheck(session, setSession);

  useEffect(() => {
    const onExpired = () => setSession(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);
  useRoleAlerts(session);

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

export default function App() {
  return (
    <AlertProvider>
      <AppContent />
    </AlertProvider>
  );
}