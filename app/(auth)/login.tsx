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

WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

const DARK = {
  bg: '#0f0f0f',
  surface: '#1a1a1a',
  border: '#2a2a2a',
  text: '#ffffff',
  textSub: '#555555',
  placeholder: '#555555',
  error: '#ff4d4d',
  btnBg: '#ffffff',
  btnText: '#000000',
  secBtnBg: '#1a1a1a',
  secBtnText: '#ffffff',
  dividerLine: '#2a2a2a',
  dividerText: '#555555',
  linkText: '#555555',
  linkHighlight: '#ffffff',
};

const LIGHT = {
  bg: '#ffffff',
  surface: '#f2f2f2',
  border: '#d5d5d5',
  text: '#000000',
  textSub: '#888888',
  placeholder: '#aaaaaa',
  error: '#cc2200',
  btnBg: '#000000',
  btnText: '#ffffff',
  secBtnBg: '#f2f2f2',
  secBtnText: '#000000',
  dividerLine: '#d5d5d5',
  dividerText: '#888888',
  linkText: '#888888',
  linkHighlight: '#000000',
};

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
            <ActivityIndicator color={C.btnText} />
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
              Don't have an account? <Text style={styles.linkHighlight}>Sign up</Text>
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
    title: {
      color: C.text,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 32,
    },
    input: {
      backgroundColor: C.surface,
      color: C.text,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: C.border,
    },
    error: {
      color: C.error,
      fontSize: 13,
      marginBottom: 12,
    },
    primaryButton: {
      backgroundColor: C.btnBg,
      borderRadius: 10,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 4,
    },
    primaryButtonText: {
      color: C.btnText,
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
      backgroundColor: C.dividerLine,
    },
    dividerText: {
      color: C.dividerText,
      fontSize: 13,
    },
    googleButton: {
      backgroundColor: C.secBtnBg,
      borderRadius: 10,
      paddingVertical: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: C.border,
    },
    googleButtonText: {
      color: C.secBtnText,
      fontSize: 15,
      fontWeight: '500',
    },
    linkRow: {
      marginTop: 24,
      alignItems: 'center',
    },
    linkText: {
      color: C.linkText,
      fontSize: 14,
    },
    linkHighlight: {
      color: C.linkHighlight,
      fontWeight: '600',
    },
  });
}
