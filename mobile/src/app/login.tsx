import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ScanLine, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError(loginError.message);
    }
    setLoading(false);
  };

  // Helper to validate email format
  const isEmailValid = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text.trim());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-neutral-950"
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
        className="px-6 py-12"
      >
        <View className="w-full max-w-sm mx-auto">
          {/* Header/Branding */}
          <View className="items-center mb-8">
            <View className="bg-blue-600/10 border border-blue-500/30 p-5 rounded-3xl mb-4 shadow-lg shadow-blue-500/10">
              <ScanLine size={36} color="#60a5fa" />
            </View>
            <Text className="text-white text-3xl font-extrabold tracking-tight">Inventory Tracker</Text>
            <Text className="text-neutral-400 text-xs mt-1.5 tracking-wider uppercase font-semibold">
              Mobile Sales & Scanning
            </Text>
          </View>

          {/* Form Card */}
          <View className="bg-neutral-900/50 border border-neutral-900 p-6 rounded-2xl shadow-xl shadow-black/40">
            {/* Email Field */}
            <View className="mb-4">
              <Text className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                Email Address
              </Text>
              <View 
                className={`flex-row items-center bg-neutral-950 border rounded-xl px-3.5 py-1 ${
                  focusedField === 'email' 
                    ? 'border-blue-500/80 shadow-md shadow-blue-500/10' 
                    : 'border-neutral-850'
                }`}
              >
                <Mail size={16} color={focusedField === 'email' ? '#60a5fa' : '#525252'} />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="name@company.com"
                  placeholderTextColor="#525252"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-white text-sm px-3 py-3 font-medium"
                />
                {email.trim().length > 0 && (
                  <View className="pr-1">
                    {isEmailValid(email) ? (
                      <CheckCircle2 size={16} color="#34d399" />
                    ) : (
                      <AlertCircle size={16} color="#fbbf24" />
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-6">
              <Text className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                Password
              </Text>
              <View 
                className={`flex-row items-center bg-neutral-950 border rounded-xl px-3.5 py-1 ${
                  focusedField === 'password' 
                    ? 'border-blue-500/80 shadow-md shadow-blue-500/10' 
                    : 'border-neutral-850'
                }`}
              >
                <Lock size={16} color={focusedField === 'password' ? '#60a5fa' : '#525252'} />
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  placeholderTextColor="#525252"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-white text-sm px-3 py-3 font-medium"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  {showPassword ? (
                    <EyeOff size={16} color="#525252" />
                  ) : (
                    <Eye size={16} color="#525252" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View className="flex-row items-center gap-2 bg-red-950/20 border border-red-900/30 rounded-xl p-3 mb-4">
                <AlertCircle size={14} color="#f87171" />
                <Text className="flex-1 text-red-400 text-xs font-semibold leading-snug">
                  {error}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              className={`w-full bg-blue-600 rounded-xl py-3.5 items-center justify-center shadow-lg shadow-blue-500/10 ${
                loading ? 'opacity-70' : ''
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-sm">Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
