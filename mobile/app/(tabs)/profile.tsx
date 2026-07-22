import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, StatusBar } from 'react-native';
import { supabase } from '@/lib/supabase';
import { formatAppError } from '@/lib/utils';
import { User, LogOut, Settings, ShieldCheck, CheckCircle2, Lock } from 'lucide-react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { triggerHaptic } from '@/lib/haptics';

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [roleName, setRoleName] = useState<string>('Staff');
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || null);
          const { data: userData } = await supabase
            .from('users')
            .select('role, roles(name)')
            .eq('auth_id', user.id)
            .single();

          const rolesData = userData?.roles as any;
          if (Array.isArray(rolesData) && rolesData.length > 0 && rolesData[0]?.name) {
            setRoleName(rolesData[0].name);
          } else if (rolesData?.name) {
            setRoleName(rolesData.name);
          } else if (userData?.role) {
            setRoleName(userData.role);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    triggerHaptic('warning');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of TEEKEH Scanner?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            triggerHaptic('medium');
            setSigningOut(true);
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                triggerHaptic('error');
                Alert.alert('Sign Out Failed ❌', formatAppError(error));
              } else {
                triggerHaptic('success');
              }
            } catch (err: any) {
              triggerHaptic('error');
              Alert.alert('Sign Out Failed ❌', formatAppError(err));
            } finally {
              setSigningOut(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#09090B] items-center justify-center">
        <ActivityIndicator size="large" color="#C8A348" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#09090B]" edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View className="pb-4 pt-2 px-6 bg-[#09090B] border-b border-[#24242A]">
        <View className="flex-row items-center gap-3">
          <View className="bg-[#C8A348]/15 border border-[#C8A348]/30 p-2.5 rounded-2xl">
            <Settings size={22} color="#C8A348" />
          </View>
          <View>
            <Text className="text-white text-2xl font-black tracking-tight">System Settings</Text>
            <Text className="text-[#C8A348] text-xs mt-0.5 font-semibold uppercase tracking-wider">TEEKEH Scanner Config</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        {/* User Card */}
        <View className="bg-[#121214] border border-[#24242A] rounded-3xl p-5 flex-row items-center gap-4">
          <View className="bg-[#C8A348]/15 border border-[#C8A348]/30 h-14 w-14 rounded-2xl items-center justify-center">
            <User color="#C8A348" size={26} />
          </View>
          <View className="flex-1">
            <Text className="text-white font-extrabold text-lg" numberOfLines={1}>{email || 'TEEKEH Staff'}</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <View className="px-2.5 py-0.5 bg-[#C8A348]/20 border border-[#C8A348]/40 rounded-full">
                <Text className="text-[#C8A348] text-[10px] font-black uppercase tracking-wider">{roleName}</Text>
              </View>
              <Text className="text-neutral-400 text-xs font-medium">• Active Session</Text>
            </View>
          </View>
        </View>

        {/* Role Permissions Card */}
        <View className="bg-[#121214] border border-[#24242A] rounded-3xl p-5 gap-3">
          <View className="flex-row items-center gap-2.5 mb-1">
            <ShieldCheck size={18} color="#C8A348" />
            <Text className="text-white font-bold text-sm tracking-tight">Role Permissions ({roleName})</Text>
          </View>
          <View className="bg-[#09090B] border border-[#24242A] rounded-2xl p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-neutral-300 text-xs font-semibold pr-2">Barcode & QR Scanning</Text>
              <View className="flex-row items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                <CheckCircle2 size={14} color="#34d399" />
                <Text className="text-emerald-400 text-[10px] font-bold">Enabled</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-neutral-300 text-xs font-semibold pr-2">POS Sales Checkout</Text>
              <View className="flex-row items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                <CheckCircle2 size={14} color="#34d399" />
                <Text className="text-emerald-400 text-[10px] font-bold">Enabled</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-neutral-300 text-xs font-semibold pr-2">Stock In / Out Adjustments</Text>
              <View className="flex-row items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                <CheckCircle2 size={14} color="#34d399" />
                <Text className="text-emerald-400 text-[10px] font-bold">Enabled</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-neutral-300 text-xs font-semibold pr-2">Full Reports & Staff Control</Text>
              {roleName.toLowerCase() === 'owner' ? (
                <View className="flex-row items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                  <CheckCircle2 size={14} color="#34d399" />
                  <Text className="text-emerald-400 text-[10px] font-bold">Enabled</Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
                  <Lock size={12} color="#71717A" />
                  <Text className="text-neutral-400 text-[10px] font-bold">Owner Only</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          disabled={signingOut}
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex-row items-center justify-center gap-2 mt-2"
        >
          {signingOut ? (
            <ActivityIndicator color="#f87171" size="small" />
          ) : (
            <>
              <LogOut color="#f87171" size={18} />
              <Text className="text-red-400 font-extrabold text-base">Sign Out of App</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

