import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { colors } from '../theme/theme';

export default function SwipePager({ pages, pageWidth, height }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleMomentumEnd = useCallback(
    (e) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
      setActiveIndex(index);
    },
    [pageWidth]
  );

  return (
    <View>
      <FlatList
        data={pages}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
        renderItem={({ item }) => <View style={{ width: pageWidth, height }}>{item}</View>}
      />
      {pages.length > 1 && (
        <View style={styles.dotsRow}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { backgroundColor: colors.gold, width: 16 },
});
