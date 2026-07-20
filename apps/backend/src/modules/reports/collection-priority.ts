export interface CollectionPriorityInput {
  daysOverdue: number;
  overdueInstallments: number;
  brokenPromises: number;
  daysSinceLastContact: number | null;
}

export interface CollectionPriority {
  score: number;
  level: 'URGENT' | 'HIGH' | 'MEDIUM';
  reasons: string[];
  suggestedAction: string;
}

export function calculateCollectionPriority(input: CollectionPriorityInput): CollectionPriority {
  const overdueScore = Math.min(Math.max(input.daysOverdue, 0), 60);
  const installmentScore = Math.min(Math.max(input.overdueInstallments - 1, 0), 3) * 10;
  const promiseScore = Math.min(Math.max(input.brokenPromises, 0), 2) * 20;
  const contactScore = getContactScore(input.daysSinceLastContact);
  const score = overdueScore + installmentScore + promiseScore + contactScore;

  const reasons = [`${input.daysOverdue} días de atraso`];
  if (input.brokenPromises > 0) reasons.unshift('Promesa de pago incumplida');
  if (input.overdueInstallments > 1) {
    reasons.push(`${input.overdueInstallments} cuotas vencidas`);
  }
  if (input.daysSinceLastContact === null) reasons.push('Sin gestión registrada');
  else if (input.daysSinceLastContact >= 7) {
    reasons.push(`${input.daysSinceLastContact} días sin contacto`);
  }

  return {
    score,
    level: score >= 70 ? 'URGENT' : score >= 40 ? 'HIGH' : 'MEDIUM',
    reasons,
    suggestedAction: getSuggestedAction(input),
  };
}

function getContactScore(daysSinceLastContact: number | null) {
  if (daysSinceLastContact === null || daysSinceLastContact >= 14) return 15;
  if (daysSinceLastContact >= 7) return 8;
  return 0;
}

function getSuggestedAction(input: CollectionPriorityInput) {
  if (input.brokenPromises > 0) return 'Contactar por promesa incumplida';
  if (input.daysOverdue >= 30) return 'Negociar acuerdo de pago';
  if (input.daysSinceLastContact === null || input.daysSinceLastContact >= 7) {
    return 'Intentar contacto hoy';
  }
  return 'Recordar cuota vencida';
}
