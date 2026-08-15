/**
 * ChapterCard — renders a chapter list item.
 * Minimal, focused card to serve as navigation entry to the reader.
 */
import React, { useCallback } from 'react';
import { Text, Pressable, StyleSheet, View } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import type { ChapterListItem } from '../types/api';

interface ChapterCardProps {
  chapter: ChapterListItem;
  onPress: (chapter: ChapterListItem) => void;
}

export const ChapterCard = React.memo(function ChapterCard({
  chapter,
  onPress,
}: ChapterCardProps) {
  const handlePress = useCallback(() => onPress(chapter), [chapter, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Read ${chapter.title}`}
      id={`chapter-card-${chapter.id}`}
    >
      <View style={styles.numberContainer}>
        <Text style={styles.number}>{chapter.number}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {chapter.title}
        </Text>
        <Text style={styles.meta}>
          {chapter.pageCount} {chapter.pageCount === 1 ? 'page' : 'pages'}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    backgroundColor: Colors.surfaceHover,
    transform: [{ scale: 0.98 }],
  },
  numberContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  number: {
    ...Typography.title,
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  title: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  meta: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: Colors.textMuted,
    marginLeft: Spacing.sm,
  },
});
