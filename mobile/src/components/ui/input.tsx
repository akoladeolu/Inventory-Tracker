import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, TouchableOpacity } from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <Text className="text-[#A1A1AA] text-[10px] font-bold uppercase tracking-widest mb-1">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center bg-[#09090B] border rounded-2xl px-4 min-h-[48px] ${
          error
            ? 'border-red-500/80 bg-red-500/5'
            : isFocused
            ? 'border-[#C8A348]'
            : 'border-[#27272A]'
        }`}
      >
        {leftIcon && <View className="mr-2.5">{leftIcon}</View>}
        <TextInput
          placeholderTextColor="#52525B"
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`flex-1 text-white text-sm font-medium py-3 ${className}`}
          accessibilityLabel={label}
          {...props}
        />
        {rightIcon && <View className="ml-2.5">{rightIcon}</View>}
      </View>
      {error && (
        <Text className="text-red-400 text-xs font-semibold mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
