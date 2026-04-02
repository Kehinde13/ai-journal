import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { supabase } from '@config/supabase';
import { useAuth } from '@context/AuthContext';
import { getRelativeTime } from '../../utils/time';
import { DARK, LIGHT } from '../../constants/colors';

type Entry = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  mood: string | null;
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const skW = StyleSheet.create({
  w25: { width: '25%' },
  w45: { width: '45%' },
  w55: { width: '55%' },
  w60: { width: '60%' },
  w65: { width: '65%' },
  w70: { width: '70%' },
  w75: { width: '75%' },
  w80: { width: '80%' },
  w90: { width: '90%' },
  w100: { width: '100%' },
});

const SKELETON_ROWS = [
  [skW.w55, skW.w100, skW.w80],
  [skW.w70, skW.w100, skW.w65],
  [skW.w45, skW.w100, skW.w90],
  [skW.w60, skW.w100, skW.w75],
];

function SkeletonList({ C }: { C: typeof DARK }) {
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

  return (
    <Animated.View style={{ opacity: anim, paddingHorizontal: 20 }}>
      {SKELETON_ROWS.map((widths, i) => (
        <View key={i}>
          <View style={{ paddingVertical: 16 }}>
            {widths.map((w, j) => (
              <View
                key={j}
                style={[
                  w,
                  {
                    height: j === 0 ? 14 : 11,
                    borderRadius: 4,
                    backgroundColor: C.skeleton,
                    marginBottom: j < widths.length - 1 ? 8 : 0,
                  },
                ]}
              />
            ))}
            <View style={[skW.w25, { height: 10, borderRadius: 4, backgroundColor: C.skeleton, marginTop: 10 }]} />
          </View>
          {i < 3 && <View style={{ height: 1, backgroundColor: C.separator }} />}
        </View>
      ))}
    </Animated.View>
  );
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

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const styles = getStyles(C);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  const fetchEntries = async () => {
    setError('');
    const { data, error: e } = await supabase
      .from('entries')
      .select('id, title, content, created_at, mood')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (e) {
      setError(e.message);
    } else {
      setEntries(data ?? []);
    }
    setLoading(false);
  };

  const reload = () => {
    setLoading(true);
    fetchEntries();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError('');
    const { data, error: e } = await supabase
      .from('entries')
      .select('id, title, content, created_at, mood')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (e) setError(e.message);
    else setEntries(data ?? []);
    setRefreshing(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEntries();
    }, [])
  );

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    signOut();
  };

  const uniqueMoods = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const e of entries) {
      if (e.mood) {
        const key = e.mood.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(key);
        }
      }
    }
    return result;
  }, [entries]);

  useEffect(() => {
    if (selectedMood && !uniqueMoods.includes(selectedMood)) {
      setSelectedMood(null);
    }
  }, [uniqueMoods]);

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (selectedMood) {
      result = result.filter((e) => e.mood?.toLowerCase() === selectedMood);
    }
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entries, selectedMood, debouncedQuery]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>No internet connection</Text>
        </View>
      )}

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.heading}>📝 Journal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(app)/new-entry')}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.summaryStrip}
        onPress={() => router.push('/(app)/summary')}
        activeOpacity={0.7}
      >
        <Text style={styles.summaryStripText}>✦ Weekly Summary</Text>
        <Text style={styles.summaryStripArrow}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.trendsStrip}
        onPress={() => router.push('/(app)/charts')}
        activeOpacity={0.7}
      >
        <Text style={styles.trendsStripText}>▲ Mood Trends</Text>
        <Text style={styles.trendsStripArrow}>→</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.skeletonWrapper}>
          <SkeletonList C={C} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={reload}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyText}>No entries yet.</Text>
          <Text style={styles.emptyHint}>Tap + to write your first entry.</Text>
        </View>
      ) : (
        <>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search entries..."
                placeholderTextColor={C.placeholder}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.clearBtn}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {uniqueMoods.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
              style={styles.chipsScroll}
            >
              <TouchableOpacity
                style={[styles.chip, selectedMood === null && styles.chipActive]}
                onPress={() => setSelectedMood(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedMood === null && styles.chipTextActive]}>
                  All
                </Text>
              </TouchableOpacity>

              {uniqueMoods.map((mood) => (
                <TouchableOpacity
                  key={mood}
                  style={[styles.chip, selectedMood === mood && styles.chipActive]}
                  onPress={() => setSelectedMood((prev) => (prev === mood ? null : mood))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, selectedMood === mood && styles.chipTextActive]}>
                    {moodEmoji(mood)}{' '}
                    {mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {filteredEntries.length === 0 ? (
            <View style={styles.centered}>
              <Text style={styles.noResultsEmoji}>🔍</Text>
              <Text style={styles.noResultsText}>
                {`No results for "${debouncedQuery || selectedMood}"`}
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedMood(null);
                }}
              >
                <Text style={styles.retryText}>Clear filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredEntries}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={C.accent}
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push(`/(app)/entry/${item.id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.title || 'Untitled'}
                  </Text>
                  <Text style={styles.cardPreview} numberOfLines={2}>
                    {item.content.length > 80 ? item.content.slice(0, 80) + '…' : item.content}
                  </Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardDate}>{getRelativeTime(item.created_at)}</Text>
                    {item.mood ? (
                      <Text style={styles.cardMood}>
                        {moodEmoji(item.mood)} {item.mood}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
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
    offlineBanner: {
      backgroundColor: C.error,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    offlineBannerText: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
    },
    greeting: {
      color: C.textMuted,
      fontSize: 13,
      marginBottom: 2,
    },
    heading: {
      color: C.text,
      fontSize: 26,
      fontWeight: '700',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    signOutBtn: {
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    signOutText: {
      color: C.textMuted,
      fontSize: 13,
    },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnText: {
      color: '#ffffff',
      fontSize: 22,
      lineHeight: 24,
      fontWeight: '400',
    },
    skeletonWrapper: {
      paddingTop: 8,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    errorText: {
      color: C.error,
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 24,
      marginBottom: 4,
    },
    retryBtn: {
      marginTop: 4,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: C.border,
    },
    retryText: {
      color: C.textMuted,
      fontSize: 14,
      fontWeight: '500',
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyText: {
      color: C.text,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyHint: {
      color: C.textMuted,
      fontSize: 14,
    },
    noResultsEmoji: {
      fontSize: 36,
      marginBottom: 4,
    },
    noResultsText: {
      color: C.textMuted,
      fontSize: 15,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    summaryStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    summaryStripText: {
      color: C.accent,
      fontSize: 13,
      fontWeight: '600',
    },
    summaryStripArrow: {
      color: C.accent,
      fontSize: 15,
    },
    trendsStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    trendsStripText: {
      color: C.accentDeep,
      fontSize: 13,
      fontWeight: '600',
    },
    trendsStripArrow: {
      color: C.accentDeep,
      fontSize: 15,
    },
    searchRow: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    searchInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 40,
      gap: 8,
    },
    searchIcon: {
      color: C.placeholder,
      fontSize: 18,
      lineHeight: 22,
    },
    searchInput: {
      flex: 1,
      color: C.text,
      fontSize: 14,
      paddingVertical: 0,
    },
    clearBtn: {
      color: C.textMuted,
      fontSize: 20,
      lineHeight: 22,
      paddingLeft: 4,
    },
    chipsScroll: {
      flexGrow: 0,
    },
    chipsRow: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      gap: 8,
      flexDirection: 'row',
    },
    chip: {
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: C.card,
      borderColor: C.border,
    },
    chipActive: {
      backgroundColor: C.accent,
      borderColor: C.accent,
    },
    chipText: {
      color: C.textMuted,
      fontSize: 13,
    },
    chipTextActive: {
      color: '#ffffff',
      fontWeight: '600',
    },
    list: {
      padding: 20,
    },
    separator: {
      height: 1,
      backgroundColor: C.separator,
    },
    card: {
      paddingVertical: 16,
      paddingLeft: 14,
      borderLeftWidth: 3,
      borderLeftColor: C.accent,
    },
    cardTitle: {
      color: C.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    cardPreview: {
      color: C.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 8,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardDate: {
      color: C.placeholder,
      fontSize: 12,
    },
    cardMood: {
      color: C.placeholder,
      fontSize: 12,
      textTransform: 'capitalize',
    },
  });
}
