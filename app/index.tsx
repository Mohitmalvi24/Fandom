/**
 * Landing Page — infinite-scroll FlashList of story cards.
 *
 * - Fed by useInfiniteQuery against GET /stories
 * - Prefetches next page with tuned onEndReachedThreshold (0.5)
 * - Shows skeleton loading state and per-error-code error display
 */
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, ScrollView, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, Stack } from 'expo-router';
import { useStoriesQuery } from '../src/api';
import { StoryCard } from '../src/components/StoryCard';
import { ErrorDisplay } from '../src/components/ErrorDisplay';
import { SkeletonBox } from '../src/components/SkeletonBox';
import { Colors, Spacing, Typography, BorderRadius } from '../src/constants/theme';
import type { Story } from '../src/types/api';


function StorySkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <SkeletonBox width={130} height={200} borderRadius={0} />
      <View style={styles.skeletonContent}>
        <SkeletonBox width="100%" height={20} />
        <SkeletonBox width="60%" height={14} style={{ marginTop: 8 }} />
        <SkeletonBox width="100%" height={40} style={{ marginTop: 12 }} />
        <SkeletonBox width={80} height={24} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

export default function LandingPage() {
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
  } = useStoriesQuery();

  const stories = data?.pages.flatMap((page) => page.data) ?? [];

  const handleStoryPress = useCallback(
    (story: Story) => {
      router.push(`/story/${story.id}`);
    },
    [router]
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Story }) => (
      <StoryCard story={item} onPress={handleStoryPress} />
    ),
    [handleStoryPress]
  );

  const keyExtractor = useCallback((item: Story) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📚 Discover Stories</Text>
          <Text style={styles.headerSubtitle}>
            Explore comics from your favorite creators
          </Text>
        </View>
        {Array.from({ length: 5 }).map((_, i) => (
          <StorySkeleton key={i} />
        ))}
      </View>
    );
  }

  if (isError && error) {
    return <ErrorDisplay error={error} onRetry={() => refetch()} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Nav */}
      <View style={styles.topNav}>
        <Text style={styles.logoText}>FANON</Text>
        <Pressable style={styles.signInBtn}>
          <Text style={styles.signInText}>Sign-in</Text>
        </Pressable>
      </View>

      <FlashList
        data={stories}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.header}>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={Colors.primary} size="small" />
              <Text style={styles.footerText}>Loading...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>No Stories Yet</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f111a',
  },
  listContent: {
    paddingBottom: 100,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 50, // Safe area top approx
    paddingBottom: Spacing.md,
    backgroundColor: '#0f111a',
  },
  logoText: {
    ...Typography.displayMedium,
    color: '#ffcc00',
    fontStyle: 'italic',
    fontWeight: '900',
  },
  signInBtn: {
    borderWidth: 1,
    borderColor: '#4d5980',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  signInText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16192b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcc00',
    paddingHorizontal: Spacing.md,
    height: 44,
    marginBottom: Spacing.xl,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  fandomsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  fandomsTitle: {
    color: '#9ba1b0',
    fontWeight: '700',
    fontSize: 16,
  },
  viewAll: {
    color: '#9ba1b0',
    fontWeight: '700',
    fontSize: 10,
  },
  fandomsScroll: {
    marginBottom: Spacing.xl,
  },
  fandomCard: {
    backgroundColor: '#ffffff',
    width: 130,
    height: 60,
    borderRadius: 8,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fandomText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
  },
  heroTextMain: {
    color: '#ffa3a3', // gradient look simulation
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroTextSub: {
    color: '#66b3ff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  filterPill: {
    backgroundColor: '#1c2238',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2b3453',
  },
  filterText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
  },
  popularText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  footerText: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
  },
  emptyContainer: {
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
  },
  skeletonCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1c2238',
  },
  skeletonContent: {
    flex: 1,
    padding: Spacing.lg,
  },
});
