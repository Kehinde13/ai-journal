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
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  textBody: '#cccccc',
  textSub: '#888888',
  textFaint: '#555555',
  error: '#ff4d4d',
};

const LIGHT = {
  bg: '#ffffff',
  separator: '#e5e5e5',
  text: '#000000',
  textBody: '#333333',
  textSub: '#555555',
  textFaint: '#888888',
  error: '#cc2200',
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
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEntry = async () => {
      const { data, error: e } = await supabase
        .from('entries')
        .select('id, title, content, created_at')
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
          <Text style={styles.content}>{entry.content}</Text>
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
    content: {
      color: C.textBody,
      fontSize: 16,
      lineHeight: 26,
    },
  });
}
