import { api } from '../api';
import type { ApiResponse, Client, ClientDetail, CreateClientDto } from '@inversiones/shared';

export interface PaginatedClients {
  data: Client[];
  total: number;
  stats?: {
    total: number;
    active: number;
    withoutLoans: number;
    recent: number;
  };
}

export async function getClients(search?: string, take = 50, skip = 0): Promise<PaginatedClients> {
  const params: Record<string, string> = {};
  if (search) params.search = search;
  if (take !== 50) params.take = String(take);
  if (skip > 0) params.skip = String(skip);
  const { data } = await api.get<ApiResponse<PaginatedClients>>('/clients', { params });
  return (data.data as PaginatedClients) ?? { data: [], total: 0 };
}

export async function getClient(id: number | string): Promise<ClientDetail> {
  const { data } = await api.get<ApiResponse<ClientDetail>>(`/clients/${id}`);
  return data.data as ClientDetail;
}

export async function getClientBasic(id: number | string): Promise<Client> {
  const { data } = await api.get<ApiResponse<Client>>(`/clients/basic/${id}`);
  return data.data as Client;
}

export async function createClient(dto: CreateClientDto): Promise<Client> {
  const { data } = await api.post<ApiResponse<Client>>('/clients', dto);
  return data.data as Client;
}

export async function updateClient(id: number | string, dto: Partial<CreateClientDto>): Promise<Client> {
  const { data } = await api.patch<ApiResponse<Client>>(`/clients/${id}`, dto);
  return data.data as Client;
}

export async function deleteClient(id: number | string): Promise<void> {
  await api.delete(`/clients/${id}`);
}
