import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Settings } from 'lucide-react-native';

export default function ProfileScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email || null);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-neutral-950 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-950">
      <View className="pt-16 pb-6 px-6 bg-neutral-900 border-b border-neutral-800">
        <View className="flex-row items-center gap-3">
          <View className="bg-blue-600/20 p-2.5 rounded-xl">
            <Settings size={24} color="#60a5fa" />
          </View>
          <Text className="text-white text-2xl font-bold tracking-tight">Settings</Text>
        </View>
      </View>

      <View className="p-6 gap-6">
        <View className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex-row items-center gap-4">
          <View className="bg-neutral-800 h-12 w-12 rounded-full items-center justify-center">
            <User color="#a3a3a3" size={24} />
          </View>
          <View>
            <Text className="text-white font-semibold text-lg">Staff Member</Text>
            <Text className="text-neutral-400">{email}</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleLogout}
          disabled={signingOut}
          className="bg-red-950/40 border border-red-900/50 rounded-2xl p-4 flex-row items-center justify-center gap-2"
        >
          {signingOut ? (
            <ActivityIndicator color="#f87171" size="small" />
          ) : (
            <>
              <LogOut color="#f87171" size={20} />
              <Text className="text-red-400 font-semibold text-base">Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
