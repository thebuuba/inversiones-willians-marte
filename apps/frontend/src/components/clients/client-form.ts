import type { ClientDetail, CreateClientDto } from '@inversiones/shared';

export interface ClientFormState {
  firstName: string;
  lastName: string;
  identification: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  dependents: string;
  phone: string;
  altPhone: string;
  email: string;
  address: string;
  notes: string;
  photo: string;
}

export function getEmptyClientForm(): ClientFormState {
  return {
    firstName: '',
    lastName: '',
    identification: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    nationality: '',
    dependents: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    notes: '',
    photo: '',
  };
}

export function getClientFormFromClient(client: ClientDetail): ClientFormState {
  return {
    firstName: client.firstName ?? '',
    lastName: client.lastName ?? '',
    identification: client.identification ?? '',
    birthDate: client.birthDate ? client.birthDate.slice(0, 10) : '',
    gender: client.gender ?? '',
    maritalStatus: client.maritalStatus ?? '',
    nationality: client.nationality ?? '',
    dependents: client.dependents == null ? '' : String(client.dependents),
    phone: client.phone ?? '',
    altPhone: client.altPhone ?? '',
    email: client.email ?? '',
    address: client.address ?? '',
    notes: client.notes ?? '',
    photo: client.photo ?? '',
  };
}

export function getClientPayload(
  form: ClientFormState,
  includeEmptyPhoto = false,
): CreateClientDto {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    identification: form.identification.trim() || undefined,
    phone: form.phone.trim() || undefined,
    altPhone: form.altPhone.trim() || undefined,
    email: form.email.trim() || undefined,
    address: form.address.trim() || undefined,
    birthDate: form.birthDate || undefined,
    gender: form.gender || undefined,
    maritalStatus: form.maritalStatus || undefined,
    nationality: form.nationality.trim() || undefined,
    dependents: form.dependents ? Number(form.dependents) : undefined,
    photo: form.photo || (includeEmptyPhoto ? '' : undefined),
    notes: form.notes.trim() || undefined,
  };
}
