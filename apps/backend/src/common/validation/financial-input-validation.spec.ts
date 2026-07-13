import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateClientDto } from '../../modules/clients/dto/create-client.dto';
import { CreateInvestorPaymentDto } from '../../modules/investor-payments/dto/create-investor-payment.dto';
import { AddLoanCapitalDto } from '../../modules/loans/dto/add-loan-capital.dto';
import { CreateLoanDto } from '../../modules/loans/dto/create-loan.dto';
import { CreatePaymentDto } from '../../modules/payments/dto/create-payment.dto';

describe('financial input validation', () => {
  it('rejects fractional loan terms', async () => {
    const dto = plainToInstance(CreateLoanDto, {
      clientId: 1,
      productId: 'product-1',
      principal: 1000,
      term: 1.5,
      startDate: '2026-07-13',
    });

    const errors = await validate(dto);

    expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ property: 'term' })]));
  });

  it.each([
    [
      'loan start date',
      CreateLoanDto,
      {
        clientId: 1,
        productId: 'product-1',
        principal: 1000,
        term: 1,
        startDate: 'not-a-date',
      },
      'startDate',
    ],
    [
      'payment date',
      CreatePaymentDto,
      {
        loanId: 'loan-1',
        clientId: 1,
        amount: 100,
        paymentDate: 'not-a-date',
      },
      'paymentDate',
    ],
    [
      'investor payment date',
      CreateInvestorPaymentDto,
      {
        investmentId: 'investment-1',
        amount: 100,
        periodMonth: 7,
        periodYear: 2026,
        paymentDate: 'not-a-date',
      },
      'paymentDate',
    ],
    [
      'capital effective date',
      AddLoanCapitalDto,
      { amount: 100, effectiveDate: 'not-a-date' },
      'effectiveDate',
    ],
    [
      'client birth date',
      CreateClientDto,
      { firstName: 'Ana', lastName: 'Diaz', birthDate: 'not-a-date' },
      'birthDate',
    ],
  ])('rejects an invalid %s', async (_label, Dto, value, property) => {
    const dto = plainToInstance(Dto, value);

    const errors = await validate(dto);

    expect(errors).toEqual(expect.arrayContaining([expect.objectContaining({ property })]));
  });
});
