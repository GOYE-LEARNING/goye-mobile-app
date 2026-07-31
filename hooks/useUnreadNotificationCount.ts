import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { getUnreadCount } from '@/services/api';

export function useUnreadNotificationCount() {
  const { token, isAuthenticated } = useUser();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let isMounted = true;
    const fetchCount = async () => {
      try {
        const result = await getUnreadCount(token);
        if (isMounted) setCount(result.data?.totalUnread ?? 0);
      } catch (err) {
        console.error('[useUnreadNotificationCount] Error fetching unread count:', err);
      }
    };

    fetchCount();
    return () => {
      isMounted = false;
    };
  }, [token, isAuthenticated]);

  return count;
}
