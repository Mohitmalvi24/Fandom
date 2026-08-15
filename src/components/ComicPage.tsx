/**
 * ComicPage — renders a single comic page with pre-computed dimensions.
 *
 * Key behaviors:
 * - Uses the API-provided width/height to compute display height BEFORE image loads
 *   → eliminates layout shift/jank as images pop in
 * - Shows a skeleton placeholder per page while loading
 * - expo-image with disk cache and retry for picsum 429s
 * - Memoized to prevent re-renders during scroll
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import { SkeletonBox } from './SkeletonBox';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import type { Page } from '../types/api';

interface ComicPageProps {
  page: Page;
  /** If provided, overrides screen width for layout calculation */
  containerWidth?: number;
}

export const ComicPage = React.memo(function ComicPage({
  page,
  containerWidth,
}: ComicPageProps) {
  const { width: screenWidth } = useWindowDimensions();
  const displayWidth = containerWidth ?? screenWidth;

  // Pre-compute display height from API-provided aspect ratio
  const aspectRatio = page.width / page.height;
  const displayHeight = displayWidth / aspectRatio;

  const [loaded, setLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setImageError(false);
  }, []);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const handleRetry = useCallback(() => {
    setImageError(false);
    setRetryCount((c) => c + 1);
  }, []);

  // Append retry count as cache-busting param for 429 retries
  const imageUri =
    retryCount > 0 ? `${page.url}?retry=${retryCount}` : page.url;

  return (
    <View
      style={[styles.container, { width: displayWidth, height: displayHeight }]}
      id={`comic-page-${page.number}`}
    >
      {!loaded && !imageError && (
        <SkeletonBox
          width={displayWidth}
          height={displayHeight}
          borderRadius={0}
          style={styles.skeleton}
        />
      )}

      {imageError ? (
        <View style={[styles.errorContainer, { height: displayHeight }]}>
          <Text style={styles.errorIcon}>📷</Text>
          <Text style={styles.errorText}>Image failed to load</Text>
          <Text style={styles.errorSubtext}>
            This may be due to picsum rate-limiting (429)
          </Text>
          <Pressable
            onPress={handleRetry}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel={`Retry loading page ${page.number}`}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <Image
          source={{ uri: imageUri }}
          style={{ width: displayWidth, height: displayHeight }}
          contentFit="cover"
          transition={200}
          cachePolicy="disk"
          recyclingKey={`page-${page.id}`}
          onLoad={handleLoad}
          onError={handleError}
          placeholder={{ blurhash: 'L5H2EC=PM+yV0g-mq.wG9c010J}I' }}
        />
      )}

      {/* Page number overlay */}
      <View style={styles.pageNumber}>
        <Text style={styles.pageNumberText}>{page.number}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  skeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  errorSubtext: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.warningBg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  retryText: {
    ...Typography.bodySmall,
    color: Colors.warning,
    fontWeight: '600',
  },
  pageNumber: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  pageNumberText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
});
