import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-600/95 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md">
      <WifiOff className="h-4 w-4 text-amber-200" />
      <span>Sin conexión. Los cambios quedan pendientes y se reintentan al recuperar el servidor.</span>
    </div>
  );
};
