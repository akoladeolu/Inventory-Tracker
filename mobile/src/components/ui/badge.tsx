import React from 'react';
import { View, Text } from 'react-native';

export interface BadgeProps {
  label: string;
  variant?: 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export function Badge({ label, variant = 'gold', size = 'md', icon, className = '' }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'gold':
        return {
          bg: 'bg-[#C8A348]/15 border-[#C8A348]/30',
          text: 'text-[#C8A348]',
        };
      case 'success':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30',
          text: 'text-emerald-400',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30',
          text: 'text-amber-400',
        };
      case 'danger':
        return {
          bg: 'bg-red-500/15 border-red-500/30',
          text: 'text-red-400',
        };
      case 'info':
        return {
          bg: 'bg-blue-500/15 border-blue-500/30',
          text: 'text-blue-400',
        };
      case 'neutral':
        return {
          bg: 'bg-white/5 border-white/10',
          text: 'text-neutral-300',
        };
    }
  };

  const styles = getVariantStyles();
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 rounded-lg' : 'px-3 py-1 rounded-xl';
  const textSizeStyles = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <View className={`flex-row items-center gap-1 border ${styles.bg} ${sizeStyles} ${className}`}>
      {icon && <View>{icon}</View>}
      <Text className={`font-black uppercase tracking-wider ${styles.text} ${textSizeStyles}`}>
        {label}
      </Text>
    </View>
  );
}
