import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@config/supabase';
import { useAuth } from '@context/AuthContext';
import { analyseEntry } from '../../../services/ai';
import { getRelativeTime } from '../../../utils/time';
import { DARK, LIGHT } from '../../../constants/colors';

type Entry = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  mood: string | null;
  mood_score: number | null;
  insights: string | null;
};

const entrySkW = StyleSheet.create({
  w35: { width: '35%' },
  w65: { width: '65%' },
  w70: { width: '70%' },
  w100: { width: '100%' },
});

function SkeletonEntry({ C }: { C: typeof DARK }) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const line = (w: ViewStyle, h: number, mb: number) => (
    <View style={[w, { height: h, borderRadius: 4, backgroundColor: C.skeleton, marginBottom: mb }]} />
  );

  return (
    <Animated.View style={{ opacity: anim, padding: 24 }}>
      {line(entrySkW.w65, 24, 10)}
      {line(entrySkW.w35, 11, 28)}
      <View style={{ height: 80, borderRadius: 12, backgroundColor: C.skeleton, marginBottom: 16 }} />
      <View style={{ height: 100, borderRadius: 12, backgroundColor: C.skeleton, marginBottom: 24 }} />
      {line(entrySkW.w100, 13, 8)}
      {line(entrySkW.w100, 13, 8)}
      {line(entrySkW.w100, 13, 8)}
      {line(entrySkW.w70, 13, 0)}
    </Animated.View>
  );
}

export default function EntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const styles = getStyles(C);

  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const fetchEntry = async () => {
      const { data, error: e } = await supabase
        .from('entries')
        .select('id, title, content, created_at, mood, mood_score, insights')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (e) {
        setError(e.message);
      } else {
        setEntry(data);
      }
      setLoading(false);
    };

    fetchEntry();
  }, [id]);

  const startEdit = () => {
    setEditTitle(entry?.title ?? '');
    setEditContent(entry?.content ?? '');
    setEditError('');
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    if (!editContent.trim()) {
      setEditError('Content cannot be empty.');
      return;
    }
    setEditError('');
    setSaving(true);

    const trimmedTitle = editTitle.trim() || null;
    const trimmedContent = editContent.trim();

    const { error: updateErr } = await supabase
      .from('entries')
      .update({ title: trimmedTitle, content: trimmedContent })
      .eq('id', id)
      .eq('user_id', user!.id);

    if (updateErr) {
      setEditError(updateErr.message);
      setSaving(false);
      return;
    }

    let newMood: string | null = entry?.mood ?? null;
    let newMoodScore: number | null = entry?.mood_score ?? null;
    let newInsights: string | null = entry?.insights ?? null;

    try {
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;
      if (accessToken) {
        const result = await analyseEntry(trimmedContent, accessToken);
        if (result?.mood || result?.moodScore !== undefined) {
          newMood = result.mood ?? null;
          newMoodScore = result.moodScore ?? null;
          newInsights = result.insights ?? null;

          await supabase
            .from('entries')
            .update({ mood: newMood, mood_score: newMoodScore, insights: newInsights })
            .eq('id', id);
        }
      }
    } catch {
      // AI re-analysis failed — keep existing mood data
    }

    setEntry(prev =>
      prev
        ? { ...prev, title: trimmedTitle ?? '', content: trimmedContent, mood: newMood, mood_score: newMoodScore, insights: newInsights }
        : prev
    );
    setSaving(false);
    setIsEditing(false);
  };

  const moodEmoji = (mood: string) => {
    const m = mood.toLowerCase();
    if (/happy|joy/.test(m)) return '😊';
    if (/sad|melancholy/.test(m)) return '😢';
    if (/anxi|stress/.test(m)) return '😰';
    if (/angry|frustrat/.test(m)) return '😤';
    if (/calm|peaceful/.test(m)) return '😌';
    if (/excit/.test(m)) return '🤩';
    if (/tired|exhaust/.test(m)) return '😴';
    if (/grateful/.test(m)) return '🙏';
    return '📝';
  };

  const scoreCircles = (score: number) => {
    const filled = Math.round(Math.max(0, Math.min(10, score)));
    return '●'.repeat(filled) + '○'.repeat(10 - filled);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setDeleting(true);
            const { error: e } = await supabase
              .from('entries')
              .delete()
              .eq('id', id)
              .eq('user_id', user!.id);
            if (e) {
              setError(e.message);
              setDeleting(false);
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        {isEditing ? (
          <>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.backBtn} disabled={saving}>
              <Text style={styles.backText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEditSave}
              disabled={saving}
              style={[styles.editSaveBtn, saving && styles.editSaveBtnDisabled]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={[styles.editSaveBtnText, saving && styles.editSaveBtnTextDisabled]}>Save</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            {entry && !loading && (
              <TouchableOpacity onPress={startEdit} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {loading ? (
        <SkeletonEntry C={C} />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : isEditing ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.body}>
            <TextInput
              style={styles.editTitleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Title (optional)"
              placeholderTextColor={C.placeholder}
              maxLength={120}
            />
            <View style={styles.editDivider} />
            <TextInput
              style={styles.editContentInput}
              value={editContent}
              onChangeText={setEditContent}
              placeholder="What's on your mind..."
              placeholderTextColor={C.placeholder}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            {editError ? <Text style={styles.editErrorText}>{editError}</Text> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : entry ? (
        <ScrollView contentContainerStyle={styles.body}>
          {entry.title ? (
            <Text style={styles.title}>{entry.title}</Text>
          ) : null}
          <Text style={styles.date}>{getRelativeTime(entry.created_at)}</Text>
          {(entry.mood || entry.mood_score !== null) ? (
            <View style={styles.moodCard}>
              <View style={styles.moodRow}>
                {entry.mood ? (
                  <>
                    <Text style={styles.moodEmoji}>{moodEmoji(entry.mood)}</Text>
                    <Text style={styles.moodLabel}>{entry.mood}</Text>
                  </>
                ) : null}
              </View>
              {entry.mood_score !== null ? (
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreCircles}>{scoreCircles(entry.mood_score)}</Text>
                  <Text style={styles.scoreText}>{entry.mood_score}/10</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {entry.insights ? (
            <View style={styles.insightsCard}>
              <Text style={styles.insightsHeading}>Insights</Text>
              <Text style={styles.insightsText}>{entry.insights}</Text>
            </View>
          ) : null}
          <Text style={styles.content}>{entry.content}</Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Text style={styles.deleteBtnText}>Deleting...</Text>
            ) : (
              <Text style={styles.deleteBtnText}>Delete Entry</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </View>
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
      paddingVertical: 4,
    },
    backText: {
      color: C.textMuted,
      fontSize: 15,
    },
    editBtn: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    editBtnText: {
      color: C.textMuted,
      fontSize: 14,
      fontWeight: '500',
    },
    editSaveBtn: {
      backgroundColor: C.accent,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 18,
      minWidth: 64,
      alignItems: 'center',
    },
    editSaveBtnDisabled: {
      backgroundColor: C.border,
    },
    editSaveBtnText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    editSaveBtnTextDisabled: {
      color: C.textMuted,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingHorizontal: 24,
    },
    errorEmoji: {
      fontSize: 36,
      marginBottom: 4,
    },
    errorText: {
      color: C.error,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 4,
    },
    goBackBtn: {
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 28,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    goBackText: {
      color: C.textMuted,
      fontSize: 14,
      fontWeight: '500',
    },
    body: {
      padding: 24,
    },
    title: {
      color: C.text,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
    },
    date: {
      color: C.placeholder,
      fontSize: 13,
      marginBottom: 24,
    },
    moodCard: {
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      borderLeftWidth: 3,
      borderLeftColor: C.accent,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      gap: 10,
    },
    moodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    moodEmoji: {
      fontSize: 24,
    },
    moodLabel: {
      color: C.text,
      fontSize: 16,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    scoreCircles: {
      color: C.accent,
      fontSize: 13,
      letterSpacing: 2,
    },
    scoreText: {
      color: C.textMuted,
      fontSize: 12,
    },
    insightsCard: {
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      gap: 8,
    },
    insightsHeading: {
      color: C.accentDeep,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    insightsText: {
      color: C.text,
      fontSize: 14,
      lineHeight: 22,
    },
    content: {
      color: C.text,
      fontSize: 16,
      lineHeight: 28,
    },
    deleteBtn: {
      marginTop: 48,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: C.error,
      borderRadius: 8,
    },
    deleteBtnText: {
      color: C.error,
      fontSize: 15,
      fontWeight: '600',
    },
    editTitleInput: {
      color: C.text,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 12,
      paddingVertical: 0,
    },
    editDivider: {
      height: 1,
      backgroundColor: C.border,
      marginBottom: 16,
    },
    editContentInput: {
      color: C.text,
      fontSize: 16,
      lineHeight: 26,
      minHeight: 200,
      paddingVertical: 0,
    },
    editErrorText: {
      color: C.error,
      fontSize: 13,
      marginTop: 8,
    },
  });
}
