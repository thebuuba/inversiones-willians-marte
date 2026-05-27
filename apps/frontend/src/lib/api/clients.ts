import { api } from '../api';
import type { ApiResponse, Client, ClientDetail, CreateClientDto } from '@inversiones/shared';

export async function getClients(search?: string): Promise<Client[]> {
  const params = search ? { search } : {};
  const { data } = await api.get<ApiResponse<Client[]>>('/clients', { params });
  return data.data ?? [];
}

export async function getClient(id: string): Promise<ClientDetail> {
  const { data } = await api.get<ApiResponse<ClientDetail>>(`/clients/${id}`);
  return data.data as ClientDetail;
}

export async function createClient(dto: CreateClientDto): Promise<Client> {
  const { data } = await api.post<ApiResponse<Client>>('/clients', dto);
  return data.data as Client;
}

export async function updateClient(id: string, dto: Partial<CreateClientDto>): Promise<Client> {
  const { data } = await api.patch<ApiResponse<Client>>(`/clients/${id}`, dto);
  return data.data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`);
}
