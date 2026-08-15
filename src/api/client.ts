/**
 * API client for the Fanon backend.
 *
 * - Reads base URL from EXPO_PUBLIC_API_URL env var (falls back to localhost:3001)
 * - Sends a stable X-Request-Id header per session for log correlation
 * - Parses the API error envelope and throws typed ApiError instances
 * - Handles retries for image 429s separately from API errors
 */
import type {
  ApiErrorCode,
  ApiErrorEnvelope,
  ChapterDetail,
  ChapterListItem,
  PaginatedResponse,
  Story,
} from '../types/api';

// ─── Config ──────────────────────────────────────────────────────
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://10.93.80.229:3001';

/** Stable per-session ID; regenerated only on full app restart */
const SESSION_REQUEST_ID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// ─── Custom Error Class ──────────────────────────────────────────
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;

  constructor(code: ApiErrorCode, message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }

  /** User-friendly message per error code */
  get userMessage(): string {
    switch (this.code) {
      case 'INVALID_LIMIT':
        return 'The page size requested is out of range. Try refreshing.';
      case 'INVALID_CURSOR':
        return 'Page cursor is invalid or expired. Try going back and refreshing.';
      case 'MISSING_PARAMETER':
        return 'A required parameter is missing. This is a client bug.';
      case 'NOT_FOUND':
        return "The content you're looking for couldn't be found.";
      case 'METHOD_NOT_ALLOWED':
        return 'Invalid request method. This is a client bug.';
      case 'INTERNAL':
      default:
        return 'Something went wrong on the server. Please try again.';
    }
  }
}

// ─── Image Error Class ───────────────────────────────────────────
export class ImageLoadError extends Error {
  public readonly statusCode: number;
  public readonly isRateLimited: boolean;

  constructor(url: string, statusCode: number) {
    super(
      statusCode === 429
        ? `Image rate-limited (429): ${url}`
        : `Image failed to load (${statusCode}): ${url}`
    );
    this.name = 'ImageLoadError';
    this.statusCode = statusCode;
    this.isRateLimited = statusCode === 429;
  }
}

// ─── Core Fetch ──────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const url = new URL(path, BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'X-Request-Id': SESSION_REQUEST_ID,
    },
  });

  if (!response.ok) {
    let errorBody: ApiErrorEnvelope | null = null;
    try {
      errorBody = (await response.json()) as ApiErrorEnvelope;
    } catch {
      // Response wasn't JSON — fall through to generic error
    }

    if (errorBody?.error) {
      throw new ApiError(
        errorBody.error.code,
        errorBody.error.message,
        response.status
      );
    }

    throw new ApiError('INTERNAL', `HTTP ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

// ─── Endpoint Functions ──────────────────────────────────────────
export async function fetchStories(
  cursor?: string | null,
  limit: number = 20
): Promise<PaginatedResponse<Story>> {
  const raw = await apiFetch<any>('/stories', {
    cursor: cursor ?? undefined,
    limit,
  });
  return {
    data: raw.page.map((s: any) => ({
      id: s.storyId,
      title: s.title,
      description: s.description || '',
      coverUrl: s.thumbnailUrl,
      author: s.creators ? s.creators.join(', ') : '',
      chapterCount: s.chapterCount,
      tags: s.tags || [],
      views: s.views || '0',
      createdAt: s.lastUpdated || '',
      updatedAt: s.lastUpdated || '',
    })),
    page: 1,
    hasMore: raw.hasMore,
    continueCursor: raw.continueCursor,
  };
}

export async function fetchChapters(
  storyId: string,
  cursor?: string | null,
  limit: number = 20
): Promise<PaginatedResponse<ChapterListItem>> {
  const raw = await apiFetch<any>('/chapters', {
    story: storyId,
    cursor: cursor ?? undefined,
    limit,
  });
  return {
    data: raw.page.map((c: any) => ({
      id: c.chapterId,
      storyId: storyId,
      title: c.description || `Chapter ${c.chapterNum}`,
      number: c.chapterNum,
      pageCount: c.pageCount,
      createdAt: '',
    })),
    page: 1,
    hasMore: raw.hasMore,
    continueCursor: raw.continueCursor,
  };
}

export async function fetchChapterDetail(
  chapterId: string
): Promise<ChapterDetail> {
  const raw = await apiFetch<any>(`/chapters/${chapterId}`);
  return {
    id: chapterId,
    storyId: '',
    title: `Chapter ${raw.chapterNum}`,
    number: raw.chapterNum,
    pages: raw.chapterPages.map((p: any) => ({
      id: p.pageUrl,
      url: p.pageUrl,
      width: p.resolution[0],
      height: p.resolution[1],
      number: p.pageNum,
    })),
    createdAt: '',
  };
}

export async function checkHealth(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/health');
}

export { SESSION_REQUEST_ID, BASE_URL };
