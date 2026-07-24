import { getLoanCollectionStatus } from './loan-collection-status';

const now = new Date(2026, 6, 10);
const loan = {
  balance: 1000,
  interestType: 'FIXED',
  endDate: new Date(2026, 11, 30),
  schedule: [] as Array<{ dueDate: Date; status: string }>,
};

describe('getLoanCollectionStatus', () => {
  it('uses the configured grace period for pending and late installments', () => {
    expect(
      getLoanCollectionStatus(
        { ...loan, schedule: [{ dueDate: new Date(2026, 6, 5), status: 'PENDING' }] },
        5,
        now,
      ),
    ).toBe('PENDING');
    expect(
      getLoanCollectionStatus(
        { ...loan, schedule: [{ dueDate: new Date(2026, 6, 4), status: 'PENDING' }] },
        5,
        now,
      ),
    ).toBe('LATE');
  });

  it('keeps a new installment pending while older unpaid installments make the loan late', () => {
    expect(
      getLoanCollectionStatus(
        {
          ...loan,
          schedule: [
            { dueDate: new Date(2026, 5, 30), status: 'PENDING' },
            { dueDate: new Date(2026, 6, 10), status: 'PENDING' },
          ],
        },
        5,
        now,
      ),
    ).toBe('LATE');
  });
});
