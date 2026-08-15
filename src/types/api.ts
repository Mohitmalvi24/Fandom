/**
 * API type definitions for the Fanon Comic Reader.
 *
 * API contract inferred from the assignment brief:
 * - Pagination envelope: { data, page, hasMore, continueCursor }
 * - Error envelope: { error: { code, message } }
 * - Page dimensions: width/height per page
 * - Type A/B is inferred from whether height is constant across pages
 */

// ─── Pagination ──────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  hasMore: boolean;
  continueCursor: string | null;
}

// ─── Error Envelope ──────────────────────────────────────────────
export type ApiErrorCode =
  | 'INVALID_LIMIT'
  | 'INVALID_CURSOR'
  | 'MISSING_PARAMETER'
  | 'NOT_FOUND'
  | 'METHOD_NOT_ALLOWED'
  | 'INTERNAL';

export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

// ─── Story ───────────────────────────────────────────────────────
export interface Story {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  author: string;
  chapterCount: number;
  tags: string[];
  views: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Chapter (list item) ─────────────────────────────────────────
export interface ChapterListItem {
  id: string;
  storyId: string;
  title: string;
  number: number;
  pageCount: number;
  createdAt: string;
}

// ─── Page ────────────────────────────────────────────────────────
export interface Page {
  id: string;
  url: string;
  width: number;
  height: number;
  number: number;
}

// ─── Chapter (detail, includes pages) ────────────────────────────
export interface ChapterDetail {
  id: string;
  storyId: string;
  title: string;
  number: number;
  pages: Page[];
  createdAt: string;
}

// ─── Page type detection ─────────────────────────────────────────
/** Type A: all pages share the same height. Type B: heights vary. */
export type PageType = 'A' | 'B';

export function detectPageType(pages: Page[]): PageType {
  if (pages.length <= 1) return 'A';
  const firstHeight = pages[0].height;
  return pages.every((p) => p.height === firstHeight) ? 'A' : 'B';
}

// ─── Zoom Persistence ────────────────────────────────────────────
export interface ZoomState {
  chapterId: string;
  scale: number;
  focalX: number;
  focalY: number;
}
