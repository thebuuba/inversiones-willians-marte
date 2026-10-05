import { api } from '../api';
import type { ApiResponse, TaskItem, CreateTaskDto, UpdateTaskDto } from '@inversiones/shared';

export async function getTasksCount(status?: string): Promise<number> {
  const params = status ? { status } : {};
  const { data } = await api.get<ApiResponse<number>>('/tasks/count', { params });
  return (data.data as number) ?? 0;
}

export async function getTasks(): Promise<TaskItem[]> {
  const tasks: TaskItem[] = [];
  while (true) {
    const { data } = await api.get<ApiResponse<TaskItem[]>>('/tasks', {
      params: { take: 100, skip: tasks.length },
    });
    const page = data.data ?? [];
    tasks.push(...page);
    if (page.length < 100) return tasks;
  }
}

export async function createTask(dto: CreateTaskDto): Promise<TaskItem> {
  const { data } = await api.post<ApiResponse<TaskItem>>('/tasks', dto);
  return data.data as TaskItem;
}

export async function updateTask(id: string, dto: UpdateTaskDto): Promise<TaskItem> {
  const { data } = await api.patch<ApiResponse<TaskItem>>(`/tasks/${id}`, dto);
  return data.data as TaskItem;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
