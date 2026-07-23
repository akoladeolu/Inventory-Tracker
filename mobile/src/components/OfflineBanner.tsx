import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { WifiOff, RefreshCw } from 'lucide-react-native';

export function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, triggerManualSync } = useOfflineStatus();

  if (isOnline && pendingCount === 0) return null;

  return (
    <View className={`px-4 py-2 flex-row items-center justify-between ${
      !isOnline ? 'bg-amber-600' : 'bg-blue-600'
    }`}>
      <View className="flex-row items-center gap-2">
        <WifiOff size={16} color="#FFFFFF" />
        <Text className="text-white text-xs font-bold">
          {!isOnline
            ? `Offline Mode ${pendingCount > 0 ? \`(\${pendingCount} pending sync)\` : ''}`
            : `Syncing ${pendingCount} offline transactions...`}
        </Text>
      </View>
      {isOnline && (
        <TouchableOpacity onPress={triggerManualSync} disabled={isSyncing}>
          <RefreshCw size={14} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
