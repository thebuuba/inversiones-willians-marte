import type { ApiResponse, GlobalSearchResult } from '@inversiones/shared';
import { api } from '../api';

export async function globalSearch(query: string, signal?: AbortSignal) {
  const { data } = await api.get<ApiResponse<GlobalSearchResult[]>>('/search', {
    params: { q: query },
    signal,
  });
  return data.data ?? [];
}
