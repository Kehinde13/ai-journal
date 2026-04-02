import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@config/supabase';
import { DARK, LIGHT } from '../../constants/colors';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const styles = getStyles(C);

  const handleSignup = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    console.log('[signup] EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    try {
      const result = await supabase.auth.signUp({ email, password });
      console.log('[signup] signUp result:', JSON.stringify(result, null, 2));
      if (result.error) {
        console.log('[signup] error:', result.error.message, result.error);
        setError(result.error.message);
        setLoading(false);
      }
    } catch (err) {
      console.log('[signup] unexpected exception:', err);
      setError('Unexpected error — check console');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.inner}>
        <Text style={styles.appName}>📝 AI Journal</Text>
        <Text style={styles.title}>Create account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={C.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={C.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignup} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create account</Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>
              Already have an account?{' '}
              <Text style={styles.linkHighlight}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

function getStyles(C: typeof DARK) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    inner: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    appName: {
      color: C.accent,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
    },
    title: {
      color: C.text,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 32,
    },
    input: {
      backgroundColor: C.inputBg,
      color: C.text,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: C.inputBorder,
    },
    error: {
      color: C.error,
      fontSize: 13,
      marginBottom: 12,
    },
    primaryButton: {
      backgroundColor: C.accent,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 4,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    linkRow: {
      marginTop: 24,
      alignItems: 'center',
    },
    linkText: {
      color: C.textMuted,
      fontSize: 14,
    },
    linkHighlight: {
      color: C.accent,
      fontWeight: '600',
    },
  });
}
