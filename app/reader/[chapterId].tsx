/**
 * Reader Screen — the core comic reader with three mode capabilities:
 *
 * Feature 1 (Required): Vertical single-page scroll
 *   - Type A pages: uses fixed item size (uniform height known from API)
 *   - Type B pages: pre-computes display height from per-page width/height
 *   - Skeleton placeholder per page while loading
 *
 * Feature 2 (Optional): Double-page spread toggle
 *   - Horizontal PagerView showing two pages per screen
 *   - Auto-engages on landscape (expo-screen-orientation listener)
 *   - Cover/first page shown alone (documented decision)
 *   - Handles: odd page count, mixed heights, 1-page chapters
 *
 * Feature 3 (Optional): Synced pinch-zoom with MMKV persistence
 *   - Single shared Reanimated scale value at chapter level
 *   - Pinch-zooming on page N applies same scale to all pages
 *   - Persists { chapterId, scale, focalPoint } on gesture end
 *   - Restores on cold start mount
 *   - Max zoom capped at 4x (based on 6000px max image height)
 */
import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import PagerView from 'react-native-pager-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  type GestureType,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChapterDetailQuery } from '../../src/api';
import { ComicPage } from '../../src/components/ComicPage';
import { DoublePageSpread } from '../../src/components/DoublePageSpread';
import { ErrorDisplay } from '../../src/components/ErrorDisplay';
import { SkeletonBox } from '../../src/components/SkeletonBox';
import { useOrientation } from '../../src/hooks/useOrientation';
import { getZoomState, setZoomState } from '../../src/storage/zoom';
import { detectPageType, type Page } from '../../src/types/api';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  MAX_ZOOM_SCALE,
  MIN_ZOOM_SCALE,
} from '../../src/constants/theme';

// ─── Spread Pairing Logic ────────────────────────────────────────
/** Builds spreads: cover alone, then pairs, odd last page alone */
function buildSpreads(pages: Page[]): Array<[Page] | [Page, Page]> {
  if (pages.length === 0) return [];
  if (pages.length === 1) return [[pages[0]]];

  const spreads: Array<[Page] | [Page, Page]> = [];
  // First page (cover) shown alone
  spreads.push([pages[0]]);

  // Pair the rest
  for (let i = 1; i < pages.length; i += 2) {
    if (i + 1 < pages.length) {
      spreads.push([pages[i], pages[i + 1]]);
    } else {
      spreads.push([pages[i]]); // Odd last page
    }
  }

  return spreads;
}

// ─── Reader Header ───────────────────────────────────────────────
function ReaderHeader({
  title,
  pageCount,
  isSpreadMode,
  onToggleSpread,
  onBack,
  currentPage,
}: {
  title: string;
  pageCount: number;
  isSpreadMode: boolean;
  onToggleSpread: () => void;
  onBack: () => void;
  currentPage: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
      <Pressable
        onPress={onBack}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        id="reader-back-button"
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.headerSubtitle}>
          Page {currentPage} / {pageCount}
        </Text>
      </View>

      <Pressable
        onPress={onToggleSpread}
        style={[
          styles.spreadToggle,
          isSpreadMode && styles.spreadToggleActive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isSpreadMode ? 'Switch to single page' : 'Switch to double page spread'
        }
        id="reader-spread-toggle"
      >
        <Text style={styles.spreadToggleText}>
          {isSpreadMode ? '📖' : '📄'}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Main Reader ─────────────────────────────────────────────────
export default function ReaderScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { isLandscape } = useOrientation();

  const {
    data: chapter,
    isLoading,
    isError,
    error,
    refetch,
  } = useChapterDetailQuery(chapterId ?? '');

  // ── Spread mode state ────────────────────────────────────────
  const [manualSpreadMode, setManualSpreadMode] = useState<boolean | null>(null);
  // Auto-engage spread mode on landscape, revert on portrait
  // Manual toggle overrides auto until orientation changes
  const isSpreadMode = manualSpreadMode ?? isLandscape;

  useEffect(() => {
    // When orientation changes, reset manual override so auto takes over
    setManualSpreadMode(null);
  }, [isLandscape]);

  const toggleSpreadMode = useCallback(() => {
    setManualSpreadMode((prev) => !(prev ?? isLandscape));
  }, [isLandscape]);

  // ── Zoom state (shared Reanimated values) ────────────────────
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Restore zoom from MMKV on mount
  useEffect(() => {
    if (!chapterId) return;
    const stored = getZoomState(chapterId);
    if (stored) {
      scale.value = stored.scale;
      savedScale.value = stored.scale;
      focalX.value = stored.focalX;
      focalY.value = stored.focalY;
    }
  }, [chapterId, scale, savedScale, focalX, focalY]);

  // Persist zoom to MMKV
  const persistZoom = useCallback(
    (s: number, fx: number, fy: number) => {
      if (!chapterId) return;
      setZoomState({ chapterId, scale: s, focalX: fx, focalY: fy });
    },
    [chapterId]
  );

  // ── Pinch gesture ────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const newScale = Math.min(
        Math.max(savedScale.value * e.scale, MIN_ZOOM_SCALE),
        MAX_ZOOM_SCALE
      );
      scale.value = newScale;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // Snap to 1x if very close
      if (scale.value < 1.05) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
      runOnJS(persistZoom)(scale.value, focalX.value, focalY.value);
    });

  // ── Pan gesture (for panning when zoomed) ────────────────────
  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Double-tap to reset zoom
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      savedScale.value = 1;
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
      runOnJS(persistZoom)(1, 0, 0);
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  // ── Animated container style (applies zoom to ALL pages) ─────
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ── Page tracking ────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Computed values ──────────────────────────────────────────
  const pages = chapter?.pages ?? [];
  const pageType = useMemo(() => detectPageType(pages), [pages]);

  // For Type A: all pages same height → compute fixed display height once
  const fixedDisplayHeight = useMemo(() => {
    if (pages.length === 0) return 300;
    if (pageType === 'A') {
      const ar = pages[0].width / pages[0].height;
      return screenWidth / ar;
    }
    return undefined; // Type B: variable
  }, [pages, pageType, screenWidth]);

  // Spreads for horizontal mode
  const spreads = useMemo(() => buildSpreads(pages), [pages]);

  // ── Scroll handler for page tracking ─────────────────────────
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pages.length === 0) return;
      const offsetY = e.nativeEvent.contentOffset.y;
      if (fixedDisplayHeight) {
        // Type A: uniform pages
        const page = Math.floor(offsetY / fixedDisplayHeight) + 1;
        setCurrentPage(Math.min(Math.max(page, 1), pages.length));
      } else {
        // Type B: compute based on cumulative heights
        let cumHeight = 0;
        for (let i = 0; i < pages.length; i++) {
          const ar = pages[i].width / pages[i].height;
          cumHeight += screenWidth / ar;
          if (cumHeight > offsetY) {
            setCurrentPage(i + 1);
            return;
          }
        }
        setCurrentPage(pages.length);
      }
    },
    [pages, fixedDisplayHeight, screenWidth]
  );

  const renderVerticalItem = useCallback(
    ({ item }: { item: Page }) => <ComicPage page={item} />,
    []
  );

  // ── Loading state ────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox
            key={i}
            width={screenWidth}
            height={screenWidth * 1.4}
            borderRadius={0}
          />
        ))}
      </View>
    );
  }

  if (isError && error) {
    return <ErrorDisplay error={error} onRetry={() => refetch()} />;
  }

  if (!chapter || pages.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No pages in this chapter</Text>
      </View>
    );
  }

  // ── Spread mode (horizontal PagerView) ───────────────────────
  if (isSpreadMode) {
    return (
      <View style={styles.container}>
        <ReaderHeader
          title={chapter.title}
          pageCount={pages.length}
          isSpreadMode={isSpreadMode}
          onToggleSpread={toggleSpreadMode}
          onBack={() => router.back()}
          currentPage={currentPage}
        />
        <PagerView
          style={styles.pagerView}
          initialPage={0}
          onPageSelected={(e) => {
            const spreadIdx = e.nativeEvent.position;
            const spread = spreads[spreadIdx];
            setCurrentPage(spread[0].number);
          }}
        >
          {spreads.map((spread, idx) => (
            <View key={`spread-${idx}`} style={styles.pagerPage}>
              <DoublePageSpread
                leftPage={spread[0]}
                rightPage={spread.length > 1 ? spread[1] : undefined}
              />
            </View>
          ))}
        </PagerView>
      </View>
    );
  }

  // ── Vertical mode (default) ──────────────────────────────────
  return (
    <View style={styles.container}>
      <ReaderHeader
        title={chapter.title}
        pageCount={pages.length}
        isSpreadMode={isSpreadMode}
        onToggleSpread={toggleSpreadMode}
        onBack={() => router.back()}
        currentPage={currentPage}
      />

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.zoomContainer, animatedContainerStyle]}>
          <FlashList
            data={pages}
            renderItem={renderVerticalItem}
            keyExtractor={(item) => item.id}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.readerContent}
          />
        </Animated.View>
      </GestureDetector>

      {/* Zoom indicator */}
      <ZoomIndicator scale={scale} />
    </View>
  );
}

function ZoomIndicator({
  scale,
}: {
  scale: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: scale.value > 1.05 ? 1 : 0,
  }));

  const textStyle = useAnimatedStyle(() => ({
    // We can't directly use scale.value in Text, so we use a fixed display
    opacity: 1,
  }));

  return (
    <Animated.View style={[styles.zoomIndicator, animatedStyle]}>
      <Text style={styles.zoomText}>🔍 Zoomed</Text>
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  zoomContainer: {
    flex: 1,
  },
  readerContent: {
    paddingBottom: 40,
  },
  // ── Header ─────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.92)',
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 10,
  },
  backButton: {
    paddingRight: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backText: {
    ...Typography.title,
    color: Colors.primary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  spreadToggle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spreadToggleActive: {
    backgroundColor: Colors.primaryGlow,
  },
  spreadToggleText: {
    fontSize: 18,
  },
  // ── PagerView ──────────────────────────────────────────────
  pagerView: {
    flex: 1,
  },
  pagerPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Zoom indicator ─────────────────────────────────────────
  zoomIndicator: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  zoomText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
