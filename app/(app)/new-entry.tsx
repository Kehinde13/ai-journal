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
  Modal,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@config/supabase';
import { useAuth } from '@context/AuthContext';
import { analyseEntry } from '../../services/ai';

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
  const [analysing, setAnalysing] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Content cannot be empty.');
      return;
    }
    setError('');
    setLoading(true);

    const trimmedContent = content.trim();
    const { data: inserted, error: e } = await supabase
      .from('entries')
      .insert({
        user_id: user!.id,
        title: title.trim() || null,
        content: trimmedContent,
      })
      .select('id')
      .single();

    if (e) {
      setError(e.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setAnalysing(true);

    console.log('[AI] EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL);

    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;
      if (accessToken && inserted?.id) {
        const result = await analyseEntry(trimmedContent, accessToken);
        console.log('[AI] analyseEntry response:', JSON.stringify(result, null, 2));
        if (result?.mood || result?.moodScore !== undefined) {
          const { error: updateError } = await supabase
            .from('entries')
            .update({
              mood: result.mood ?? null,
              mood_score: result.moodScore ?? null,
              insights: result.insights ?? null,
            })
            .eq('id', inserted.id);
          if (updateError) {
            console.log('[AI] Supabase update error:', updateError.message);
          } else {
            console.log('[AI] Supabase update success — mood:', result.mood, 'moodScore:', result.moodScore);
          }
        } else {
          console.log('[AI] No mood data in response, skipping update');
        }
      }
    } catch (err) {
      console.log('[AI] analyseEntry threw:', err instanceof Error ? err.message : String(err));
    }

    router.replace(`/entry/${inserted.id}`);
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
        <TouchableOpacity onPress={handleSave} disabled={loading || analysing} style={styles.saveBtn}>
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

      <Modal visible={analysing} transparent animationType="fade">
        <View style={styles.overlay}>
          <ActivityIndicator color="#ffffff" size="large" />
          <Text style={styles.overlayText}>Analysing mood...</Text>
        </View>
      </Modal>
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
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    overlayText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '500',
    },
    errorText: {
      color: C.error,
      fontSize: 13,
      marginTop: 12,
    },
  });
}
