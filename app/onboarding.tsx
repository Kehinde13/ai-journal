import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ViewToken,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { DARK, LIGHT } from '../constants/colors';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    emoji: '📝',
    title: 'Your Private Journal',
    subtitle: 'Write freely. Your thoughts stay yours.',
  },
  {
    id: '2',
    emoji: '🤖',
    title: 'AI Mood Detection',
    subtitle: 'Every entry analysed for mood, score and insights.',
  },
  {
    id: '3',
    emoji: '📊',
    title: 'Weekly Summaries',
    subtitle: 'Get a weekly recap of your emotional journey.',
  },
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const scheme = useColorScheme();
  const C = scheme === 'dark' ? DARK : LIGHT;
  const styles = getStyles(C);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    router.replace('/(auth)/login');
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={isLast ? handleGetStarted : handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStyles(C: typeof DARK) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
    },
    slide: {
      width,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingBottom: 160,
    },
    emoji: {
      fontSize: 88,
      marginBottom: 36,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: C.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 16,
      color: C.textMuted,
      textAlign: 'center',
      lineHeight: 26,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: 52,
      paddingHorizontal: 32,
      alignItems: 'center',
      gap: 28,
    },
    dots: {
      flexDirection: 'row',
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.border,
    },
    dotActive: {
      backgroundColor: C.accent,
      width: 24,
    },
    button: {
      backgroundColor: C.accent,
      paddingVertical: 16,
      paddingHorizontal: 48,
      borderRadius: 50,
      width: '100%',
      alignItems: 'center',
    },
    buttonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
