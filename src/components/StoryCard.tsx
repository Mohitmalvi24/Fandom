/**
 * StoryCard — renders a story item in the landing page FlashList.
 * Uses expo-image with disk caching and solid-color placeholder.
 */
import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '../constants/theme';
import type { Story } from '../types/api';

interface StoryCardProps {
  story: Story;
  onPress: (story: Story) => void;
  style?: ViewStyle;
}

const CARD_HEIGHT = 200;
const COVER_WIDTH = 130;

export const StoryCard = React.memo(function StoryCard({
  story,
  onPress,
  style,
}: StoryCardProps) {
  const handlePress = useCallback(() => onPress(story), [story, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${story.title}`}
      id={`story-card-${story.id}`}
    >
      <View style={styles.header}>
        <View style={styles.fandomRow}>
          <Text style={styles.fandomIcon}>👌</Text>
          <Text style={styles.fandomName}>{story.tags && story.tags[0] ? story.tags[0] : 'My Little Pony'}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {story.title}
        </Text>
      </View>
      
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: story.coverUrl }}
          style={styles.cover}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          contentFit="cover"
          transition={300}
          cachePolicy="disk"
          recyclingKey={story.id}
        />
        <View style={styles.imageOverlay}>
          <Text style={styles.overlayText}>📺 {story.chapterCount} Eps</Text>
          <Text style={styles.overlayText}>👁️ {story.views}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.authorRow}>
          <View style={styles.authorAvatar} />
          <Text style={styles.author}>{story.author || 'SinfulPie'}</Text>
        </View>
        <Text style={styles.description} numberOfLines={1}>
          {story.description || `${story.title} alternative story`}
        </Text>
        <Text style={styles.tags} numberOfLines={1}>
          {story.tags && story.tags.length > 0 ? story.tags.map(t => `#${t}`).join(' ') : '#Mystery #Angst #Action #Dark'}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c2238',
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  header: {
    marginBottom: Spacing.lg,
  },
  fandomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  fandomIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  fandomName: {
    ...Typography.bodySmall,
    color: '#ffcc00',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    ...Typography.title,
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 24,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    height: 250,
    marginBottom: Spacing.md,
  },
  cover: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.skeleton,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  footer: {
    marginTop: Spacing.xs,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff7777', // Mock avatar color
    marginRight: 8,
  },
  author: {
    color: '#9ba1b0',
    fontWeight: '700',
    fontSize: 12,
  },
  description: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  tags: {
    color: '#9ba1b0',
    fontSize: 12,
    fontWeight: '600',
  },
});
