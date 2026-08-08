import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  username: string;
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

export async function getUserPortfolioAssignments(userId: string): Promise<string[]> {
  const { data } = await api.get<ApiResponse<{ portfolioIds: string[] }>>(
    `/users/${userId}/portfolio-assignments`,
  );
  return data.data?.portfolioIds ?? [];
}

export async function updateUserPortfolioAssignments(
  userId: string,
  portfolioIds: string[],
): Promise<string[]> {
  const { data } = await api.put<ApiResponse<{ portfolioIds: string[] }>>(
    `/users/${userId}/portfolio-assignments`,
    { portfolioIds },
  );
  return data.data?.portfolioIds ?? [];
}
