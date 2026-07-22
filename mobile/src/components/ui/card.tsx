import React from 'react';
import { View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'subtle';
  className?: string;
}

export function Card({ children, variant = 'default', className = '', style, ...props }: CardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return 'bg-[#121214] border border-[#24242A] shadow-xl';
      case 'outlined':
        return 'bg-[#09090B] border border-[#27272A]';
      case 'subtle':
        return 'bg-[#16161A] border border-[#24242A]';
    }
  };

  return (
    <View
      className={`rounded-3xl p-5 ${getVariantStyles()} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}
