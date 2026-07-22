import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ScanLine,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';

const formatAuthError = (err: any): string => {
  if (!err) return 'An unexpected error occurred. Please try again.';
  const message = typeof err === 'string' ? err : err.message || String(err);
  
  if (
    message.includes('SocketException') || 
    message.includes('Connection reset') || 
    message.includes('Network request failed') ||
    message.includes('fetch failed') ||
    message.includes('NetworkError')
  ) {
    return 'Network Connection Error: Unable to reach the server. Please check your internet connection and try again.';
  }
  
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please verify your details and try again.';
  }

  if (message.includes('Email not confirmed')) {
    return 'Email address has not been confirmed yet. Please check your inbox.';
  }

  const cleanMsg = message.replace(/^java\.[a-zA-Z0-9_.]+:?\s*/i, '').trim();
  return cleanMsg || 'Sign in failed. Please try again.';
};

import { triggerHaptic } from '@/lib/haptics';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      triggerHaptic('warning');
      setError('Please enter both your email address and password.');
      return;
    }
    triggerHaptic('light');
    setLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) {
        triggerHaptic('error');
        setError(formatAuthError(loginError));
      } else {
        triggerHaptic('success');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text.trim());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.innerContainer}>
          {/* Header/Branding */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <ScanLine size={36} color="#C8A348" />
            </View>
            <Text style={styles.title}>TEEKEH</Text>
            <Text style={styles.subtitle}>Mobile Inventory Scanner</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View
                style={[
                  styles.inputRow,
                  focusedField === 'email' && styles.inputRowFocused,
                ]}
              >
                <Mail size={16} color={focusedField === 'email' ? '#C8A348' : '#71717A'} />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="staff@teekeh.com"
                  placeholderTextColor="#52525B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.textInput}
                />
                {email.trim().length > 0 && (
                  <View style={{ paddingRight: 4 }}>
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
            <View style={[styles.fieldGroup, { marginBottom: 24 }]}>
              <Text style={styles.label}>Password</Text>
              <View
                style={[
                  styles.inputRow,
                  focusedField === 'password' && styles.inputRowFocused,
                ]}
              >
                <Lock size={16} color={focusedField === 'password' ? '#C8A348' : '#71717A'} />
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (error) setError(null);
                  }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  placeholderTextColor="#52525B"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.textInput}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={12}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#71717A" />
                  ) : (
                    <Eye size={18} color="#71717A" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color="#f87171" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#09090B" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  innerContainer: {
    width: '100%',
    maxWidth: 384,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBox: {
    backgroundColor: 'rgba(200, 163, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(200, 163, 72, 0.3)',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: '#C8A348',
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#24242A',
    padding: 24,
    borderRadius: 24,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputRowFocused: {
    borderColor: '#C8A348',
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(127, 29, 29, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#C8A348',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 3,
    shadowColor: '#C8A348',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#09090B',
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
