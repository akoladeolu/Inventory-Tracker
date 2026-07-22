import React from 'react';
import { View, Text } from 'react-native';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function Header({ title, subtitle, leftIcon, rightAction, className = '' }: HeaderProps) {
  return (
    <View className={`px-6 py-4 bg-[#09090B] border-b border-[#24242A] flex-row items-center justify-between ${className}`}>
      <View className="flex-row items-center gap-3 flex-1 pr-3">
        {leftIcon && <View>{leftIcon}</View>}
        <View className="flex-1">
          <Text className="text-white text-2xl font-black tracking-tight" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text className="text-[#C8A348] text-xs mt-0.5 font-semibold tracking-wide" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}
