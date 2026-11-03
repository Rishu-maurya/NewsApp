import { useEffect } from 'react';
import { getMe, clearSession, updateStoredSession } from '../services/authService';

// Page open hote hi backend se poochta hai: token abhi bhi sahi hai?
// - 401 / 403 (token galat, expired, ya user blocked) -> logout
// - role ya naam badla ho (jaise role request approve hui) -> session refresh
// - backend band ho (koi status nahi) -> kuch mat karo, user ko logout nahi karna
export default function useSessionCheck(session, setSession) {
  useEffect(() => {
    if (!session) return;

    getMe()
      .then((me) => {
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
        if ([401, 403].includes(err.response?.status)) {
          clearSession();
          setSession(null);
        }
      });
    // sirf page khulte waqt ek baar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
