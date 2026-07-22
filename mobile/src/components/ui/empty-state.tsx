import React from 'react';
import { View, Text } from 'react-native';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <View className={`items-center justify-center p-8 bg-[#121214] border border-[#24242A] rounded-3xl ${className}`}>
      {icon && (
        <View className="w-16 h-16 bg-[#09090B] border border-[#24242A] rounded-2xl items-center justify-center mb-4">
          {icon}
        </View>
      )}
      <Text className="text-white font-extrabold text-base text-center tracking-tight mb-1">
        {title}
      </Text>
      {description && (
        <Text className="text-neutral-400 text-xs text-center font-medium leading-relaxed max-w-[260px] mb-4">
          {description}
        </Text>
      )}
      {action && <View>{action}</View>}
    </View>
  );
}
