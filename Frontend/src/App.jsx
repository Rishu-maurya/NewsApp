import { useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import { ArticlesProvider } from './context/ArticlesContext';
import { ActivityProvider } from './context/ActivityContext';
import { getSession, clearSession } from './services/authService';

export default function App() {
  const [session, setSession] = useState(getSession());

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