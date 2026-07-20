import { calculateCollectionPriority } from './collection-priority';

describe('calculateCollectionPriority', () => {
  it('raises priority and explains broken promises and missing follow-up', () => {
    expect(
      calculateCollectionPriority({
        daysOverdue: 35,
        overdueInstallments: 2,
        brokenPromises: 1,
        daysSinceLastContact: 15,
      }),
    ).toEqual({
      score: 80,
      level: 'URGENT',
      reasons: [
        'Promesa de pago incumplida',
        '35 días de atraso',
        '2 cuotas vencidas',
        '15 días sin contacto',
      ],
      suggestedAction: 'Contactar por promesa incumplida',
    });
  });

  it('keeps a recently managed, short delay at medium priority', () => {
    expect(
      calculateCollectionPriority({
        daysOverdue: 5,
        overdueInstallments: 1,
        brokenPromises: 0,
        daysSinceLastContact: 1,
      }),
    ).toEqual({
      score: 5,
      level: 'MEDIUM',
      reasons: ['5 días de atraso'],
      suggestedAction: 'Recordar cuota vencida',
    });
  });
});
