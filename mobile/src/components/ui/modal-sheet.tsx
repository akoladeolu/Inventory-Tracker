import React from 'react';
import { View, Text, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { triggerHaptic } from '@/lib/haptics';

export interface ModalSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeightPercent?: string;
}

export function ModalSheet({
  visible,
  onClose,
  title,
  children,
}: ModalSheetProps) {
  if (!visible) return null;

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/85 items-center justify-center p-4 z-50 backdrop-blur-xl">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full"
        >
          <ScrollView
            className="w-full max-h-[88vh]"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
          >
            <View className="w-full bg-[#121214] border border-[#24242A] rounded-[32px] p-6 shadow-2xl">
              {/* Header handle / close */}
              <View className="flex-row justify-between items-center mb-6 border-b border-[#24242A] pb-4">
                {title ? (
                  <Text className="text-white font-black text-xl tracking-tight">
                    {title}
                  </Text>
                ) : (
                  <View />
                )}
                <TouchableOpacity
                  onPress={handleClose}
                  className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
                  accessibilityLabel="Close modal"
                  accessibilityRole="button"
                >
                  <X size={18} color="#A1A1AA" />
                </TouchableOpacity>
              </View>

              {/* Children Content */}
              {children}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
