# Fanon Comic Reader — Architecture Write-up

## Architecture Overview

The app uses **Expo SDK 57 + expo-router** with file-based routing across three screens: landing (`/`), chapter list (`/story/[id]`), and reader (`/reader/[chapterId]`). Data fetching is handled exclusively through **@tanstack/react-query**, with `useInfiniteQuery` for cursor-paginated lists and `useQuery` for chapter detail. A typed `ApiError` class maps each API error code to a user-friendly message. Image loading uses **expo-image** with disk caching, blurhash placeholders, and distinct retry handling for picsum 429s. Zoom state persists via **react-native-mmkv** (synchronous, survives cold starts).

## Edge Cases Handled

- **Type A vs Type B pages**: detected by checking height uniformity across pages. Type A uses `overrideItemLayout` for fixed-size FlashList items; Type B pre-computes display heights from API-provided aspect ratios.
- **Cover shown alone** in spread mode (first page never paired).
- **Odd page count**: last spread is a single centered page.
- **1-page chapter**: both vertical and spread modes handle gracefully.
- **Mixed A/B heights in spread**: pages scale independently within each half of the spread, aligned to top.
- **Picsum 429**: separate error state per page with manual retry (cache-busting query param), never confused with API errors.
- **Landscape auto-engage**: resets manual toggle when orientation changes via `expo-screen-orientation` listener.
- **Zoom snap-to-1x**: if scale < 1.05 on gesture end, snaps back to avoid stuck micro-zoom.

## Edge Cases NOT Handled

- **Right-to-left reading order** (manga mode) — would need a `direction` prop on PagerView.
- **Chapter preloading** — could prefetch next chapter's detail while reading current.
- **Offline mode** — React Query cache is in-memory; no disk persistence for API responses (only zoom state is persisted).
- **Deep linking to a specific page number** within a chapter.

## Scroll FPS

*Not yet measured on a physical device.* The recommended approach: enable Reanimated's `FrameRateMonitor` or use Android GPU profiling (Settings → Developer → Profile GPU rendering) on a mid-range device at max zoom (4x). The architecture is designed for 60fps via pre-computed layout heights and FlashList's `overrideItemLayout`.

## Three "I chose A over B" Decisions

1. **FlashList over FlatList** for all lists. FlashList's cell recycling reduces memory pressure on long chapters. *Would flip to FlatList* if encountering FlashList-specific bugs with `overrideItemLayout` and Reanimated transforms.

2. **Single shared zoom value over per-image zoom.** A single Reanimated `scale` applied to the entire scroll container means zooming one page zooms all — which is the correct comic-reader UX. *Would flip to per-image* if users needed to zoom one panel while scrolling others at 1x (annotation use case).

3. **Cover shown alone in spread mode** (not paired with page 2). This matches physical comic layout and most reader apps. *Would flip to paired* if the API exposed a `coverSpread: boolean` field indicating the cover is a full double-width image.

## Least Happy With

The pinch-zoom integration with FlashList. Wrapping FlashList in a `GestureDetector` + `Animated.View` with a scale transform works but can cause gesture conflicts between the list's native scroll and the pinch handler. A production app would likely need a custom native module or a `react-native-gesture-handler` `ScrollView` replacement to properly coordinate the two gesture systems.

## One Thing That Didn't Work

Initially tried using `react-native-reanimated`'s `useAnimatedScrollHandler` with FlashList to track page position during zoom — but FlashList doesn't expose a native animated scroll ref compatible with Reanimated's worklet-based handler, so fell back to the standard `onScroll` prop with `scrollEventThrottle={16}`.

## AI Assistance Note

AI (Antigravity) generated the initial scaffold. I rejected its first suggestion of using a bare `ScrollView` for the reader in favor of `FlashList` with `overrideItemLayout` — because the pre-computed fixed item sizes are the main lever for scroll smoothness (the prompt explicitly calls this out), and ScrollView doesn't recycle cells at all, which would kill FPS on 100+ page chapters.
