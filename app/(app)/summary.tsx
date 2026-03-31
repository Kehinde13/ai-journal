import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@config/supabase';
import { useAuth } from '@context/AuthContext';
import { weeklySummary, WeeklySummaryResult } from '../../services/ai';

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
  summaryCard: '#111111',
  summaryCardBorder: '#2a2a2a',
  insightDot: '#444444',
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
  summaryCard: '#f8f8f8',
  summaryCardBorder: '#e5e5e5',
  insightDot: '#cccccc',
};

const MOOD_EMOJI: Record<string, string> = {};

function moodEmoji(mood: string) {
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
}

export default function SummaryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const styles = getStyles(C);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<WeeklySummaryResult | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const { data: entries, error: fetchError } = await supabase
          .from('entries')
          .select('content, created_at')
          .eq('user_id', user!.id)
          .gte('created_at', monday.toISOString())
          .lte('created_at', sunday.toISOString())
          .order('created_at', { ascending: true });

        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        if (!entries || entries.length === 0) {
          setError('No entries in the last 7 days.');
          setLoading(false);
          return;
        }

        const { data: session } = await supabase.auth.getSession();
        const accessToken = session?.session?.access_token;

        if (!accessToken) {
          setError('Session expired. Please sign in again.');
          setLoading(false);
          return;
        }

        const data = await weeklySummary(entries, accessToken);
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Weekly Summary</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.text} size="large" />
          <Text style={styles.loadingText}>Generating your summary...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : result ? (
        <ScrollView contentContainerStyle={styles.body}>
          {result.dominantMood ? (
            <View style={styles.moodCard}>
              <Text style={styles.sectionLabel}>Dominant Mood</Text>
              <View style={styles.moodRow}>
                <Text style={styles.moodEmoji}>{moodEmoji(result.dominantMood)}</Text>
                <Text style={styles.moodLabel}>{result.dominantMood}</Text>
              </View>
            </View>
          ) : null}

          {result.summary ? (
            <View style={styles.summaryCard}>
              <Text style={styles.sectionLabel}>This Week</Text>
              <Text style={styles.summaryText}>{result.summary}</Text>
            </View>
          ) : null}

          {result.insights && result.insights.length > 0 ? (
            <View style={styles.insightsCard}>
              <Text style={styles.sectionLabel}>Insights</Text>
              {result.insights.map((insight, i) => (
                <View key={i} style={styles.insightRow}>
                  <Text style={styles.insightDot}>●</Text>
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>
          ) : null}
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
      gap: 4,
    },
    backBtn: {
      paddingVertical: 4,
    },
    backText: {
      color: C.textSub,
      fontSize: 15,
    },
    heading: {
      color: C.text,
      fontSize: 24,
      fontWeight: '700',
      marginTop: 6,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      paddingHorizontal: 24,
    },
    loadingText: {
      color: C.textSub,
      fontSize: 15,
    },
    errorText: {
      color: C.error,
      fontSize: 14,
      textAlign: 'center',
    },
    body: {
      padding: 20,
      gap: 16,
    },
    sectionLabel: {
      color: C.textSub,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
    },
    moodCard: {
      backgroundColor: C.moodCard,
      borderWidth: 1,
      borderColor: C.moodCardBorder,
      borderRadius: 12,
      padding: 16,
    },
    moodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    moodEmoji: {
      fontSize: 28,
    },
    moodLabel: {
      color: C.text,
      fontSize: 18,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    summaryCard: {
      backgroundColor: C.summaryCard,
      borderWidth: 1,
      borderColor: C.summaryCardBorder,
      borderRadius: 12,
      padding: 16,
    },
    summaryText: {
      color: C.textBody,
      fontSize: 15,
      lineHeight: 24,
    },
    insightsCard: {
      backgroundColor: C.summaryCard,
      borderWidth: 1,
      borderColor: C.summaryCardBorder,
      borderRadius: 12,
      padding: 16,
    },
    insightRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    insightDot: {
      color: C.insightDot,
      fontSize: 8,
      lineHeight: 22,
    },
    insightText: {
      flex: 1,
      color: C.textBody,
      fontSize: 14,
      lineHeight: 22,
    },
  });
}
