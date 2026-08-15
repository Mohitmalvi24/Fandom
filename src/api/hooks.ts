/**
 * React Query hooks for stories, chapters, and chapter detail.
 *
 * All list endpoints use useInfiniteQuery with cursor pagination
 * matching the API's { data, page, hasMore, continueCursor } envelope.
 */
import {
  useInfiniteQuery,
  useQuery,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query';
import {
  fetchStories,
  fetchChapters,
  fetchChapterDetail,
} from './client';
import type {
  PaginatedResponse,
  Story,
  ChapterListItem,
  ChapterDetail,
} from '../types/api';

// ─── Query Keys ──────────────────────────────────────────────────
export const queryKeys = {
  stories: ['stories'] as const,
  chapters: (storyId: string) => ['chapters', storyId] as const,
  chapterDetail: (chapterId: string) => ['chapterDetail', chapterId] as const,
};

// ─── Stories (Infinite) ──────────────────────────────────────────
export function useStoriesQuery() {
  return useInfiniteQuery<PaginatedResponse<Story>, Error>({
    queryKey: queryKeys.stories,
    queryFn: ({ pageParam }) =>
      fetchStories(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.continueCursor : undefined,
    staleTime: 5 * 60 * 1000, // 5 min
    gcTime: 30 * 60 * 1000, // 30 min
    retry: 2,
  });
}

// ─── Chapters for a Story (Infinite) ─────────────────────────────
export function useChaptersQuery(storyId: string) {
  return useInfiniteQuery<PaginatedResponse<ChapterListItem>, Error>({
    queryKey: queryKeys.chapters(storyId),
    queryFn: ({ pageParam }) =>
      fetchChapters(storyId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.continueCursor : undefined,
    enabled: !!storyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
}

// ─── Chapter Detail ──────────────────────────────────────────────
export function useChapterDetailQuery(chapterId: string) {
  return useQuery<ChapterDetail, Error>({
    queryKey: queryKeys.chapterDetail(chapterId),
    queryFn: () => fetchChapterDetail(chapterId),
    enabled: !!chapterId,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
  });
}
