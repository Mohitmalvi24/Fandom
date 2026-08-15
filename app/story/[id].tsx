/**
 * Story Detail / Chapter List — infinite-scroll FlashList of chapters.
 *
 * Route: /story/[id]
 * - Fetches chapters via useInfiniteQuery against GET /chapters?story={id}
 * - Tapping a chapter navigates to /reader/[chapterId]
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useChaptersQuery } from '../../src/api';
import { ChapterCard } from '../../src/components/ChapterCard';
import { ErrorDisplay } from '../../src/components/ErrorDisplay';
import { SkeletonBox } from '../../src/components/SkeletonBox';
import { Colors, Spacing, Typography } from '../../src/constants/theme';
import type { ChapterListItem } from '../../src/types/api';


function ChapterSkeleton() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBox width={40} height={40} borderRadius={6} />
      <View style={styles.skeletonContent}>
        <SkeletonBox width="70%" height={16} />
        <SkeletonBox width="30%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useChaptersQuery(id ?? '');

  const chapters = data?.pages.flatMap((page) => page.data) ?? [];

  const handleChapterPress = useCallback(
    (chapter: ChapterListItem) => {
      router.push(`/reader/${chapter.id}`);
    },
    [router]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: ChapterListItem }) => (
      <ChapterCard chapter={item} onPress={handleChapterPress} />
    ),
    [handleChapterPress]
  );

  const keyExtractor = useCallback((item: ChapterListItem) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chapters</Text>
        </View>
        {Array.from({ length: 10 }).map((_, i) => (
          <ChapterSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (isError && error) {
    return <ErrorDisplay error={error} onRetry={() => refetch()} />;
  }

  return (
    <>
      <Stack.Screen options={{ title: `Chapters` }} />
      <View style={styles.container}>
        <FlashList
          data={chapters}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {chapters.length > 0
                  ? `${chapters.length} Chapters`
                  : 'Chapters'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Select a chapter to start reading
              </Text>
            </View>
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={Colors.primary} size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📑</Text>
              <Text style={styles.emptyTitle}>No Chapters</Text>
              <Text style={styles.emptySubtitle}>
                This story doesn't have any chapters yet
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.displayMedium,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
