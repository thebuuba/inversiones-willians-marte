import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface SystemSettings {
  graceDays: number;
  companyName: string;
  companyTaxId: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  companyAddress: string | null;
}

export type UpdateSettingsInput = Partial<
  Pick<
    SystemSettings,
    'graceDays' | 'companyName' | 'companyTaxId' | 'companyEmail' | 'companyPhone' | 'companyAddress'
  >
>;

export async function getSettings() {
  const { data } = await api.get<ApiResponse<SystemSettings>>('/settings');
  return data.data as SystemSettings;
}

export async function updateSettings(input: UpdateSettingsInput | number) {
  const body = typeof input === 'number' ? { graceDays: input } : input;
  const { data } = await api.patch<ApiResponse<SystemSettings>>('/settings', body);
  return data.data as SystemSettings;
}
