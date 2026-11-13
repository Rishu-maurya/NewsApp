import { useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import { ArticlesProvider } from './context/ArticlesContext';
import { ActivityProvider } from './context/ActivityContext';
import { getSession, clearSession } from './services/authService';
import useSessionCheck from './hooks/useSessionCheck';
import useRoleAlerts from './hooks/useRoleAlerts';
import { AlertProvider } from './context/AlertContext';

function AppContent() {
  const [session, setSession] = useState(getSession());

  useSessionCheck(session, setSession);
  useRoleAlerts(session);

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  return (
    <ArticlesProvider>
      <ActivityProvider>
        <AppRoutes session={session} onLogin={setSession} onLogout={handleLogout} />
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