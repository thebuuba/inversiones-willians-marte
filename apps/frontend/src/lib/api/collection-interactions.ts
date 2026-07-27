import type {
  CollectionChannel,
  CollectionResult,
  CreateCollectionInteractionDto,
  PaymentPromiseStatus,
} from '@inversiones/shared';
import { api } from '../api';
import type { ApiResponse } from '@inversiones/shared';

export interface PaymentPromiseItem {
  id: string;
  amount: number;
  fulfilledAmount: number;
  dueDate: string;
  status: PaymentPromiseStatus;
}

export interface CollectionInteractionItem {
  id: string;
  loanId: string | null;
  clientId: number;
  channel: CollectionChannel;
  result: CollectionResult;
  notes: string;
  nextFollowUpDate: string | null;
  nextFollowUpTime: string | null;
  createdAt: string;
  createdBy: { id: string; name: string };
  promise: PaymentPromiseItem | null;
  followUpTask: { id: string; status: string; dueDate: string | null; time: string | null } | null;
}

export async function getClientCollectionInteractions(
  clientId: number,
): Promise<CollectionInteractionItem[]> {
  const { data } = await api.get<ApiResponse<CollectionInteractionItem[]>>(
    `/collection-interactions/client/${clientId}`,
  );
  return data.data ?? [];
}

export async function getLoanCollectionInteractions(
  loanId: string,
): Promise<CollectionInteractionItem[]> {
  const { data } = await api.get<ApiResponse<CollectionInteractionItem[]>>(
    `/collection-interactions/loan/${loanId}`,
  );
  return data.data ?? [];
}

export async function createCollectionInteraction(
  dto: CreateCollectionInteractionDto,
): Promise<CollectionInteractionItem> {
  const { data } = await api.post<ApiResponse<CollectionInteractionItem>>(
    '/collection-interactions',
    dto,
  );
  return data.data as CollectionInteractionItem;
}
