import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@config/supabase';
import { useAuth } from '@context/AuthContext';
import { DARK, LIGHT } from '../../constants/colors';

type Entry = {
  id: string;
  created_at: string;
  mood: string | null;
  mood_score: number;
};

const CHART_H = 180;
const BAR_MAX_H = 160;

function barColor(score: number): string {
  if (score >= 8) return '#C4874A';
  if (score >= 6) return '#D4A574';
  if (score >= 4) return '#8B5E3C';
  return '#7B4A2A';
}

function moodEmoji(mood: string): string {
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

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function SkeletonChart({ C }: { C: typeof DARK }) {
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

  const skeletonBars = [60, 110, 80, 140, 100, 70, 130, 90, 150, 60, 120, 95, 140, 75];

  return (
    <Animated.View style={{ opacity: anim, padding: 20 }}>
      <View style={{ height: 16, width: '40%', borderRadius: 4, backgroundColor: C.skeleton, marginBottom: 20 }} />
      <View style={[skStyles.chartArea, { borderColor: C.border, height: CHART_H + 20 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: CHART_H, paddingHorizontal: 8 }}>
          {skeletonBars.map((h, i) => (
            <View key={i} style={{ flex: 1, height: h, borderRadius: 4, backgroundColor: C.skeleton }} />
          ))}
        </View>
      </View>
      <View style={{ marginTop: 24, gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ height: 72, borderRadius: 12, backgroundColor: C.skeleton }} />
        ))}
      </View>
    </Animated.View>
  );
}

const skStyles = StyleSheet.create({
  chartArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
});

export default function ChartsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const styles = getStyles(C);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data, error: e } = await supabase
        .from('entries')
        .select('id, created_at, mood, mood_score')
        .eq('user_id', user!.id)
        .not('mood_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(14);

      if (e) {
        setError(e.message);
      } else {
        setEntries((data ?? []).reverse());
      }
      setLoading(false);
    };

    fetch();
  }, []);

  const avgScore =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.mood_score, 0) / entries.length
      : 0;

  const moodCounts: Record<string, number> = {};
  for (const e of entries) {
    if (e.mood) {
      const key = e.mood.toLowerCase();
      moodCounts[key] = (moodCounts[key] ?? 0) + 1;
    }
  }
  const topMoodEntry = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const topMood = topMoodEntry ? topMoodEntry[0] : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Mood Trends</Text>
      </View>

      {loading ? (
        <SkeletonChart C={C} />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No mood data yet.</Text>
          <Text style={styles.emptyHint}>
            Write some entries and let AI analyse your mood to see trends here.
          </Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Back to Journal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.sectionLabel}>Mood Score Over Time</Text>

          <View style={styles.chartWrapper}>
            <View style={styles.yAxis}>
              {[10, 8, 6, 4, 2].map((tick) => (
                <View key={tick} style={styles.yTickRow}>
                  <Text style={styles.yTickLabel}>{tick}</Text>
                </View>
              ))}
            </View>

            <View style={styles.chartBody}>
              <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                {[10, 8, 6, 4, 2].map((tick) => {
                  const fromBottom = (tick / 10) * BAR_MAX_H;
                  return (
                    <View
                      key={tick}
                      style={[
                        styles.gridLine,
                        { bottom: fromBottom + (CHART_H - BAR_MAX_H) / 2 },
                      ]}
                    />
                  );
                })}
              </View>

              <View style={styles.barsContainer}>
                {entries.map((entry) => {
                  const barH = Math.max(4, (entry.mood_score / 10) * BAR_MAX_H);
                  return (
                    <View key={entry.id} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barH,
                              backgroundColor: barColor(entry.mood_score),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.xLabel} numberOfLines={1}>
                        {formatShortDate(entry.created_at)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.legend}>
            {[
              { color: '#C4874A', label: '8–10 Great' },
              { color: '#D4A574', label: '6–7 Good' },
              { color: '#8B5E3C', label: '4–5 Okay' },
              { color: '#7B4A2A', label: '1–3 Low' },
            ].map(({ color, label }) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Breakdown</Text>

          <View style={styles.statsGrid}>
            {topMood ? (
              <View style={[styles.statCard, styles.statCardWide]}>
                <Text style={styles.statCardLabel}>Most Frequent Mood</Text>
                <View style={styles.statMoodRow}>
                  <Text style={styles.statMoodEmoji}>{moodEmoji(topMood)}</Text>
                  <Text style={styles.statMoodName}>{topMood}</Text>
                </View>
              </View>
            ) : null}

            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Avg Score</Text>
              <Text style={styles.statValue}>{avgScore.toFixed(1)}</Text>
              <Text style={styles.statUnit}>out of 10</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>Entries</Text>
              <Text style={styles.statValue}>{entries.length}</Text>
              <Text style={styles.statUnit}>analysed</Text>
            </View>
          </View>
        </ScrollView>
      )}
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
      color: C.textMuted,
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
      gap: 10,
      paddingHorizontal: 32,
    },
    errorEmoji: {
      fontSize: 36,
    },
    errorText: {
      color: C.error,
      fontSize: 14,
      textAlign: 'center',
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: 8,
    },
    emptyTitle: {
      color: C.text,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptyHint: {
      color: C.textMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
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
      padding: 20,
      paddingBottom: 40,
    },
    sectionLabel: {
      color: C.accentDeep,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 14,
    },
    chartWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    yAxis: {
      width: 28,
      height: CHART_H,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      paddingRight: 6,
      paddingVertical: (CHART_H - BAR_MAX_H) / 2,
    },
    yTickRow: {
      alignItems: 'flex-end',
    },
    yTickLabel: {
      color: C.placeholder,
      fontSize: 10,
    },
    chartBody: {
      flex: 1,
      height: CHART_H,
      position: 'relative',
    },
    gridLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: C.border,
    },
    barsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: CHART_H,
      paddingBottom: 32,
      gap: 4,
    },
    barCol: {
      flex: 1,
      alignItems: 'center',
      height: '100%',
      justifyContent: 'flex-end',
    },
    barTrack: {
      flex: 1,
      justifyContent: 'flex-end',
      width: '100%',
      alignItems: 'center',
    },
    bar: {
      width: '100%',
      borderRadius: 3,
      minHeight: 4,
    },
    xLabel: {
      color: C.placeholder,
      fontSize: 8,
      marginTop: 4,
      textAlign: 'center',
      width: '100%',
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 14,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      color: C.textMuted,
      fontSize: 11,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: 120,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 12,
      padding: 16,
      gap: 4,
    },
    statCardWide: {
      flexBasis: '100%',
      borderLeftWidth: 3,
      borderLeftColor: C.accent,
    },
    statCardLabel: {
      color: C.accentDeep,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 6,
    },
    statMoodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    statMoodEmoji: {
      fontSize: 28,
    },
    statMoodName: {
      color: C.text,
      fontSize: 18,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    statValue: {
      color: C.accent,
      fontSize: 28,
      fontWeight: '700',
    },
    statUnit: {
      color: C.placeholder,
      fontSize: 12,
    },
  });
}
