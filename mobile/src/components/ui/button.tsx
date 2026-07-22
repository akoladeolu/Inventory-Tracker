import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps, View } from 'react-native';
import { triggerHaptic } from '@/lib/haptics';

export interface ButtonProps extends TouchableOpacityProps {
  children?: React.ReactNode;
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'success';
}

export function Button({
  children,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  haptic = 'light',
  disabled,
  onPress,
  className = '',
  style,
  ...props
}: ButtonProps) {

  const handlePress = (e: any) => {
    if (loading || disabled) return;
    if (haptic) triggerHaptic(haptic);
    if (onPress) onPress(e);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-[#C8A348] border border-[#C8A348] active:opacity-90 shadow-lg shadow-[#C8A348]/20';
      case 'secondary':
        return 'bg-[#1E1E22] border border-[#24242A] active:opacity-80';
      case 'outline':
        return 'bg-transparent border border-[#C8A348]/40 active:bg-[#C8A348]/10';
      case 'ghost':
        return 'bg-transparent border-0 active:bg-white/5';
      case 'danger':
        return 'bg-red-600 border border-red-500 active:opacity-90 shadow-lg shadow-red-500/20';
      default:
        return 'bg-[#C8A348]';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'primary':
        return 'text-[#09090B] font-extrabold';
      case 'secondary':
        return 'text-white font-bold';
      case 'outline':
        return 'text-[#C8A348] font-extrabold';
      case 'ghost':
        return 'text-neutral-300 font-bold';
      case 'danger':
        return 'text-white font-extrabold';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'py-2.5 px-4 rounded-xl min-h-[38px]';
      case 'md':
        return 'py-3.5 px-6 rounded-2xl min-h-[48px]';
      case 'lg':
        return 'py-4 px-8 rounded-2xl min-h-[54px]';
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'md':
        return 'text-sm tracking-wide';
      case 'lg':
        return 'text-base tracking-wide';
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!(disabled || loading) }}
      className={`flex-row items-center justify-center gap-2 ${getVariantStyles()} ${getSizeStyles()} ${
        disabled || loading ? 'opacity-50' : ''
      } ${className}`}
      style={style}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'primary' ? '#09090B' : '#C8A348'} />
      ) : (
        <>
          {leftIcon && <View>{leftIcon}</View>}
          {title ? <Text className={`${getTextStyles()} ${getTextSizeStyles()}`}>{title}</Text> : children}
          {rightIcon && <View>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}
