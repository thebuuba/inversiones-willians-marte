import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface UserItem {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  username?: string;
  email: string;
  password: string;
  role: string;
}

export async function getUsers(): Promise<UserItem[]> {
  const { data } = await api.get<ApiResponse<UserItem[]>>('/users');
  return data.data ?? [];
}

export async function createUser(dto: CreateUserInput): Promise<UserItem> {
  const { data } = await api.post<ApiResponse<UserItem>>('/users', dto);
  return data.data as UserItem;
}

export async function toggleActiveUser(id: string): Promise<UserItem> {
  const { data } = await api.post<ApiResponse<UserItem>>(`/users/${id}/toggle-active`);
  return data.data as UserItem;
}
