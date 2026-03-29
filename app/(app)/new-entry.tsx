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
import { useRouter } from 'expo-router';
import { supabase } from '@config/supabase';
import { useAuth } from '@context/AuthContext';

const DARK = {
  bg: '#0f0f0f',
  separator: '#1e1e1e',
  text: '#ffffff',
  textBody: '#cccccc',
  textSub: '#888888',
  placeholder: '#444444',
  error: '#ff4d4d',
  btnBg: '#ffffff',
  btnText: '#000000',
};

const LIGHT = {
  bg: '#ffffff',
  separator: '#e5e5e5',
  text: '#000000',
  textBody: '#333333',
  textSub: '#555555',
  placeholder: '#aaaaaa',
  error: '#cc2200',
  btnBg: '#000000',
  btnText: '#ffffff',
};

export default function NewEntryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const styles = getStyles(C);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Content cannot be empty.');
      return;
    }
    setError('');
    setLoading(true);

    const { error: e } = await supabase.from('entries').insert({
      user_id: user!.id,
      title: title.trim() || null,
      content: content.trim(),
    });

    if (e) {
      setError(e.message);
      setLoading(false);
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveBtn}>
          {loading ? (
            <ActivityIndicator color={C.btnText} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <TextInput
          style={styles.titleInput}
          placeholder="Title (optional)"
          placeholderTextColor={C.placeholder}
          value={title}
          onChangeText={setTitle}
          maxLength={120}
        />
        <TextInput
          style={styles.contentInput}
          placeholder="Write something..."
          placeholderTextColor={C.placeholder}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          autoFocus
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingBottom: 14,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
    },
    backBtn: {
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    backText: {
      color: C.textSub,
      fontSize: 15,
    },
    saveBtn: {
      backgroundColor: C.btnBg,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 18,
      minWidth: 64,
      alignItems: 'center',
    },
    saveBtnText: {
      color: C.btnText,
      fontSize: 14,
      fontWeight: '600',
    },
    body: {
      flex: 1,
      padding: 20,
    },
    titleInput: {
      color: C.text,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 16,
      paddingVertical: 0,
    },
    contentInput: {
      flex: 1,
      color: C.textBody,
      fontSize: 16,
      lineHeight: 24,
      paddingVertical: 0,
    },
    errorText: {
      color: C.error,
      fontSize: 13,
      marginTop: 12,
    },
  });
}
