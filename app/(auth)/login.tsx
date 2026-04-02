import { useState, useEffect } from 'react';
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
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@config/supabase';
import { DARK, LIGHT } from '../../constants/colors';

WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

function GoogleSignInButton({
  onError,
  C,
  styles,
}: {
  onError: (msg: string) => void;
  C: typeof DARK;
  styles: ReturnType<typeof getStyles>;
}) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      supabase.auth
        .signInWithIdToken({ provider: 'google', token: id_token })
        .then(({ error: e }) => {
          if (e) onError(e.message);
        });
    }
  }, [response]);

  return (
    <TouchableOpacity
      style={styles.googleButton}
      onPress={() => promptAsync()}
      disabled={!request}
    >
      <Text style={styles.googleButtonText}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const styles = getStyles(C);

  const handleLogin = async () => {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) {
      setError(e.message);
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
        <Text style={styles.title}>Welcome back</Text>

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
          autoComplete="password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        {IOS_CLIENT_ID && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <GoogleSignInButton onError={setError} C={C} styles={styles} />
          </>
        )}

        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={styles.linkText}>
              Don't have an account?{' '}
              <Text style={styles.linkHighlight}>Sign up</Text>
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
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
      gap: 10,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: C.border,
    },
    dividerText: {
      color: C.textMuted,
      fontSize: 13,
    },
    googleButton: {
      backgroundColor: C.card,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: C.border,
    },
    googleButtonText: {
      color: C.text,
      fontSize: 15,
      fontWeight: '500',
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
