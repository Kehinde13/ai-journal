import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@config/supabase';
import { useAuth } from '@context/AuthContext';

type Entry = {
  id: string;
  title: string;
  content: string;
  created_at: string;
};

const DARK = {
  bg: '#0f0f0f',
  separator: '#1e1e1e',
  text: '#ffffff',
  textSub: '#888888',
  textMuted: '#555555',
  textFaint: '#444444',
  error: '#ff4d4d',
  btnBg: '#ffffff',
  btnText: '#000000',
};

const LIGHT = {
  bg: '#ffffff',
  separator: '#e5e5e5',
  text: '#000000',
  textSub: '#555555',
  textMuted: '#999999',
  textFaint: '#bbbbbb',
  error: '#cc2200',
  btnBg: '#000000',
  btnText: '#ffffff',
};

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const styles = getStyles(C);

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEntries = async () => {
    setError('');
    const { data, error: e } = await supabase
      .from('entries')
      .select('id, title, content, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (e) {
      setError(e.message);
    } else {
      setEntries(data ?? []);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchEntries();
    }, [])
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <Text style={styles.heading}>Journal</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.text} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No entries yet.</Text>
          <Text style={styles.emptyHint}>Tap + to write your first one.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
                {item.content}
              </Text>
              <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            </TouchableOpacity>
          )}
        />
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 60,
      paddingBottom: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: C.separator,
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
      backgroundColor: C.btnBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnText: {
      color: C.btnText,
      fontSize: 22,
      lineHeight: 24,
      fontWeight: '400',
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
    emptyText: {
      color: C.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 6,
    },
    emptyHint: {
      color: C.textMuted,
      fontSize: 14,
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
    },
    cardTitle: {
      color: C.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    cardPreview: {
      color: C.textSub,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 8,
    },
    cardDate: {
      color: C.textFaint,
      fontSize: 12,
    },
  });
}
