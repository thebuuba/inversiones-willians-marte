import { validate } from 'class-validator';
import { CreateLoanProductDto } from './create-loan-product.dto';

describe('CreateLoanProductDto', () => {
  it('rejects loan product names shorter than two characters', async () => {
    const dto = Object.assign(new CreateLoanProductDto(), {
      name: 'A',
      interestType: 'FLAT',
      interestRate: 24,
      paymentFrequency: 'MONTHLY',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('accepts loan product names with at least two characters', async () => {
    const dto = Object.assign(new CreateLoanProductDto(), {
      name: 'Personal',
      interestType: 'FLAT',
      interestRate: 24,
      paymentFrequency: 'MONTHLY',
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'name')).toBe(false);
  });
});
