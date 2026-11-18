import { useEffect } from 'react';
import { getMe, clearSession, updateStoredSession } from '../services/authService';


export default function useSessionCheck(session, setSession) {
  useEffect(() => {
    if (!session) return;

    let cancelled = false;
    const refreshSession = () => {
      getMe()
      .then((me) => {
        if (cancelled) return;
        const changed =
          me.role !== session.user.role ||
          me.name !== session.user.name ||
          (me.phone || '') !== (session.user.phone || '');
        if (!changed) return;

        const updated = {
          ...session,
          user: { ...session.user, name: me.name, role: me.role, phone: me.phone || '' },
        };
        updateStoredSession(updated);
        setSession(updated);
      })
      .catch((err) => {
        if (cancelled) return;
        if ([401, 403].includes(err.response?.status)) {
          clearSession();
          setSession(null);
        }
      });
    };

    refreshSession();
    window.addEventListener('focus', refreshSession);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshSession);
    };
  }, [session, setSession]);
}
