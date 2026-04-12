import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';

export const OnlineStatusIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium shadow-md ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" /> Online
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" /> Offline
        </>
      )}
    </div>
  );
};
