# AI Prompts Documentation

As requested in the assignment brief, this document outlines the professional prompts used to guide the AI (Antigravity) in architecting and building the Fanon Comic Reader application.

Instead of pasting the entire assignment brief at once, the development was broken down into modular, highly specific prompts to ensure architectural robustness and strict adherence to the performance requirements.

## 1. Initial Scaffold & Data Layer
> "Initialize a React Native Expo project using Expo Router. Set up a robust data fetching layer using `@tanstack/react-query`. Implement `useInfiniteQuery` to fetch from a local REST API (using `EXPO_PUBLIC_API_URL`). Parse the backend's cursor-based pagination envelope `{page, hasMore, continueCursor}` and map the raw fields (`storyId`, `thumbnailUrl`, `creators`) to a unified frontend interface. Implement a custom `ApiError` class that branches on specific error codes (e.g., `INVALID_LIMIT`, `NOT_FOUND`) rather than generic messages, and ensure a stable `X-Request-Id` is sent per session."

## 2. High-Performance Vertical Reader
> "Build the core reader interface using `@shopify/flash-list` for maximum FPS. The list must handle two page types:
> - **Type A (uniform height):** Use `overrideItemLayout` so the list can jump to any offset without measuring.
> - **Type B (varying height):** Pre-compute the display height using the API-provided aspect ratios *before* the image loads to prevent layout shift (jank).
> Use `expo-image` for all rendering. Enable disk caching, provide a blurhash skeleton placeholder, and implement a dedicated manual retry state specifically for `429 Too Many Requests` errors from the picsum image provider."

## 3. Double-Page Spread & Orientation
> "Implement a toggleable double-page spread mode using `react-native-pager-view`. Hook into `expo-screen-orientation` so that rotating the device to landscape automatically engages spread mode, and rotating to portrait reverts to the vertical list. 
> Ensure the following edge cases are handled in the spread calculation:
> - The first cover page must always be shown alone.
> - Odd page counts must render the final page alone, not paired with a blank slot.
> - Mixed-height pages (Type B) within the same spread must top-align seamlessly."

## 4. Synced Pinch-Zoom & Persistence
> "Implement a continuous pinch-to-zoom feature. The zoom state (scale, focalX, focalY) must live in a *single* shared `react-native-reanimated` value applied to the entire reader container, so zooming one page applies the exact same scale to the next page when scrolling.
> Cap the maximum zoom relative to the image bounds to prevent extreme blurry upscaling. Finally, persist the zoom state to disk using `react-native-mmkv` on gesture end, and restore this state whenever the chapter mounts (surviving cold starts)."

## 5. UI/UX Refinement
> "Redesign the `StoryCard` and landing page to match a premium dark-mode comic app aesthetic. Create a custom top navigation header, remove the default router headers, and style the feed cards to have a large square image. Overlay the episode count and views with a translucent dark gradient at the bottom of the image, and place the author avatar, description, and tags dynamically beneath it."
