import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_HEIGHT = 190;
const AUTO_PLAY_MS = 4500;

export default function HomeCarousel({ slides, onSlidePress }) {
  const listRef = useRef(null);
  const indexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % slides.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      indexRef.current = next;
      setActiveIndex(next);
    }, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleMomentumEnd = useCallback((e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    indexRef.current = index;
    setActiveIndex(index);
  }, []);

  return (
    <View>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        renderItem={({ item }) => (
          <Pressable style={[styles.slide, { width: SCREEN_WIDTH }]} onPress={() => onSlidePress?.(item)}>
            <LinearGradient
              colors={[item.colorFrom ?? 'rgba(242,183,5,0.22)', colors.bg]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons name={item.icon} size={130} color="rgba(242,183,5,0.09)" style={styles.watermark} />
            <View style={styles.slideContent}>
              <Text style={styles.tag}>{item.tag}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc}>{item.description}</Text>
              {!!item.buttonLabel && (
                <View style={styles.btn}>
                  <Text style={styles.btnTxt}>{item.buttonLabel}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      />
      {slides.length > 1 && (
        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { height: SLIDE_HEIGHT, justifyContent: 'flex-end', overflow: 'hidden' },
  watermark: { position: 'absolute', left: -24, top: -14 },
  slideContent: { padding: 22, paddingBottom: 18 },
  tag: { fontFamily: fonts.mono, color: colors.gold, fontSize: 10.5, letterSpacing: 1.5, textAlign: 'right', marginBottom: 6 },
  title: { fontFamily: fonts.display, color: colors.ink, fontSize: 19, textAlign: 'right', marginBottom: 4 },
  desc: { fontFamily: fonts.body, color: colors.muted, fontSize: 12.5, textAlign: 'right', marginBottom: 12, lineHeight: 18 },
  btn: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-end' },
  btnTxt: { color: colors.bg, fontFamily: fonts.bodyBold, fontSize: 12.5 },
  dotsRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.gold, width: 16 },
});
