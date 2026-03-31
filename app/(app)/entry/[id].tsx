import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@config/supabase';
import { useAuth } from '@context/AuthContext';

type Entry = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  mood: string | null;
  mood_score: number | null;
  insights: string | null;
};

const DARK = {
  bg: '#0f0f0f',
  separator: '#1e1e1e',
  text: '#ffffff',
  textBody: '#cccccc',
  textSub: '#888888',
  textFaint: '#555555',
  error: '#ff4d4d',
  moodCard: '#1a1a2e',
  moodCardBorder: '#2e2e4e',
  insightsCard: '#111111',
  insightsCardBorder: '#2a2a2a',
};

const LIGHT = {
  bg: '#ffffff',
  separator: '#e5e5e5',
  text: '#000000',
  textBody: '#333333',
  textSub: '#555555',
  textFaint: '#888888',
  error: '#cc2200',
  moodCard: '#f0f0ff',
  moodCardBorder: '#d0d0f0',
  insightsCard: '#f8f8f8',
  insightsCardBorder: '#e5e5e5',
};

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

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.text} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : entry ? (
        <ScrollView contentContainerStyle={styles.body}>
          {entry.title ? (
            <Text style={styles.title}>{entry.title}</Text>
          ) : null}
          <Text style={styles.date}>{formatDate(entry.created_at)}</Text>
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
              <ActivityIndicator color={C.error} size="small" />
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
      color: C.textSub,
      fontSize: 15,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      color: C.error,
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 24,
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
      color: C.textFaint,
      fontSize: 13,
      marginBottom: 24,
    },
    moodCard: {
      backgroundColor: C.moodCard,
      borderWidth: 1,
      borderColor: C.moodCardBorder,
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
      color: C.textSub,
      fontSize: 13,
      letterSpacing: 2,
    },
    scoreText: {
      color: C.textFaint,
      fontSize: 12,
    },
    insightsCard: {
      backgroundColor: C.insightsCard,
      borderWidth: 1,
      borderColor: C.insightsCardBorder,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      gap: 8,
    },
    insightsHeading: {
      color: C.textSub,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    insightsText: {
      color: C.textBody,
      fontSize: 14,
      lineHeight: 22,
    },
    content: {
      color: C.textBody,
      fontSize: 16,
      lineHeight: 26,
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
  });
}
