import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getPendingOperations } from '@/lib/offline/offline-db';
import { processSyncQueue, syncProductsFromServer } from '@/lib/offline/sync-engine';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkPending = async () => {
    try {
      const pending = await getPendingOperations();
      setPendingCount(pending.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkPending();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);

      if (online) {
        setIsSyncing(true);
        processSyncQueue().then(() => {
          checkPending();
          setIsSyncing(false);
        });
      }
    });

    // Initial cache sync if online
    NetInfo.fetch().then((state) => {
      if (state.isConnected) {
        syncProductsFromServer();
      }
    });

    return () => unsubscribe();
  }, []);

  const triggerManualSync = async () => {
    setIsSyncing(true);
    await processSyncQueue();
    await checkPending();
    setIsSyncing(false);
  };

  return { isOnline, pendingCount, isSyncing, triggerManualSync };
}
