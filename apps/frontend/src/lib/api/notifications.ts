import type { ApiResponse, NotificationItem } from '@inversiones/shared';
import { api } from '../api';

export async function getNotifications(): Promise<NotificationItem[]> {
  const { data } = await api.get<ApiResponse<NotificationItem[]>>('/notifications');
  return data.data ?? [];
}

export async function markNotificationsRead(keys: string[]): Promise<void> {
  await api.post('/notifications/read', { keys });
}
