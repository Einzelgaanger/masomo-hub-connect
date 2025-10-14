import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePWAUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
    onNeedRefresh() {
      console.log('New content available, refresh needed');
      setUpdateAvailable(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
      // Force reload to ensure all updates are applied
      window.location.reload();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
    setNeedRefresh(false);
  };

  return {
    updateAvailable,
    isUpdating,
    handleUpdate,
    dismissUpdate,
  };
}
