import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface SystemSettings {
  graceDays: number;
}

export async function getSettings() {
  const { data } = await api.get<ApiResponse<SystemSettings>>('/settings');
  return data.data as SystemSettings;
}

export async function updateSettings(graceDays: number) {
  const { data } = await api.patch<ApiResponse<SystemSettings>>('/settings', { graceDays });
  return data.data as SystemSettings;
}
