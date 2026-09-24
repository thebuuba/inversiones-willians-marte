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
  city?: string;
  incomeType?: string;
  occupation?: string;
  workplace?: string;
  monthlyIncome?: string;
  workTenure?: string;
  guarantorName?: string;
  guarantorRelation?: string;
  guarantorPhone?: string;
  guarantorIdentification?: string;
  referenceName?: string;
  referencePhone?: string;
  tags?: string[];
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
    nationality: 'Dominicana',
    dependents: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    city: '',
    incomeType: '',
    occupation: '',
    workplace: '',
    monthlyIncome: '',
    workTenure: '',
    guarantorName: '',
    guarantorRelation: '',
    guarantorPhone: '',
    guarantorIdentification: '',
    referenceName: '',
    referencePhone: '',
    tags: [],
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
    city: client.city ?? '',
    incomeType: client.incomeType ?? '',
    occupation: client.occupation ?? '',
    workplace: client.workplace ?? '',
    monthlyIncome: client.monthlyIncome == null ? '' : String(client.monthlyIncome),
    workTenure: client.workTenure ?? '',
    guarantorName: client.guarantorName ?? '',
    guarantorRelation: client.guarantorRelation ?? '',
    guarantorPhone: client.guarantorPhone ?? '',
    guarantorIdentification: client.guarantorIdentification ?? '',
    referenceName: client.referenceName ?? '',
    referencePhone: client.referencePhone ?? '',
    tags: client.tags ?? [],
    notes: client.notes ?? '',
    photo: client.photo ?? '',
  };
}

export function getClientPayload(
  form: ClientFormState,
  includeEmptyPhoto = false,
): CreateClientDto {
  const payload: CreateClientDto = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    identification: form.identification.trim() || undefined,
    phone: form.phone.trim() || undefined,
    altPhone: form.altPhone.trim() || undefined,
    email: form.email.trim() || undefined,
    address: form.address.trim() || undefined,
    ...(form.city && { city: form.city.trim() }),
    ...(form.incomeType && { incomeType: form.incomeType }),
    ...(form.occupation && { occupation: form.occupation.trim() }),
    ...(form.workplace && { workplace: form.workplace.trim() }),
    ...(form.monthlyIncome && { monthlyIncome: Number(form.monthlyIncome) }),
    ...(form.workTenure && { workTenure: form.workTenure }),
    ...(form.guarantorName && { guarantorName: form.guarantorName.trim() }),
    ...(form.guarantorRelation && { guarantorRelation: form.guarantorRelation }),
    ...(form.guarantorPhone && { guarantorPhone: form.guarantorPhone.trim() }),
    ...(form.guarantorIdentification && {
      guarantorIdentification: form.guarantorIdentification.trim(),
    }),
    ...(form.referenceName && { referenceName: form.referenceName.trim() }),
    ...(form.referencePhone && { referencePhone: form.referencePhone.trim() }),
    ...(form.tags?.length && { tags: form.tags }),
    birthDate: form.birthDate || undefined,
    gender: form.gender || undefined,
    maritalStatus: form.maritalStatus || undefined,
    nationality: form.nationality.trim() || undefined,
    dependents: form.dependents ? Number(form.dependents) : undefined,
    photo: form.photo || (includeEmptyPhoto ? '' : undefined),
    notes: form.notes.trim() || undefined,
  };
  if (includeEmptyPhoto) {
    Object.assign(payload, {
      city: form.city?.trim() || '',
      incomeType: form.incomeType || '',
      occupation: form.occupation?.trim() || '',
      workplace: form.workplace?.trim() || '',
      monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : null,
      workTenure: form.workTenure || '',
      guarantorName: form.guarantorName?.trim() || '',
      guarantorRelation: form.guarantorRelation || '',
      guarantorPhone: form.guarantorPhone?.trim() || '',
      guarantorIdentification: form.guarantorIdentification?.trim() || '',
      referenceName: form.referenceName?.trim() || '',
      referencePhone: form.referencePhone?.trim() || '',
      tags: form.tags || [],
    });
  }
  return payload;
}
