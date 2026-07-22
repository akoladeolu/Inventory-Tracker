import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { CheckCircle2, AlertCircle, Info, ShoppingBag, X } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';

export interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function FeedbackModal({
  visible,
  onClose,
  type = 'success',
  title,
  message,
  actionText = 'Got It',
  onAction,
}: FeedbackModalProps) {
  if (!visible) return null;

  const handleClose = () => {
    triggerHaptic('light');
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={32} color="#34d399" />;
      case 'error':
        return <AlertCircle size={32} color="#f87171" />;
      case 'warning':
        return <AlertCircle size={32} color="#fbbf24" />;
      case 'info':
        return <ShoppingBag size={32} color="#C8A348" />;
    }
  };

  const getBadgeStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/15 border-emerald-500/30';
      case 'error':
        return 'bg-red-500/15 border-red-500/30';
      case 'warning':
        return 'bg-amber-500/15 border-amber-500/30';
      case 'info':
        return 'bg-[#C8A348]/15 border-[#C8A348]/30';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/85 items-center justify-center p-5 z-50 backdrop-blur-xl">
        <View className="w-full max-w-sm bg-[#121214] border border-[#24242A] rounded-[32px] p-6 shadow-2xl items-center">
          
          {/* Icon Badge */}
          <View className={`w-16 h-16 rounded-3xl items-center justify-center border mb-5 ${getBadgeStyle()}`}>
            {getIcon()}
          </View>

          {/* Title */}
          <Text className="text-white text-xl font-black tracking-tight text-center mb-2">
            {title}
          </Text>

          {/* Description */}
          <Text className="text-neutral-300 text-xs font-medium leading-relaxed text-center mb-6 px-2">
            {message}
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleClose}
            className="w-full bg-[#C8A348] rounded-2xl py-4 items-center justify-center shadow-xl shadow-[#C8A348]/20"
            accessibilityRole="button"
          >
            <Text className="text-[#09090B] font-extrabold text-sm tracking-wide">
              {actionText}
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}
