import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { InvestorPaymentsController } from './investor-payments.controller';
import { InvestorPaymentsService } from './investor-payments.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

describe('InvestorPaymentsController routing', () => {
  let app: INestApplication;
  const service = {
    create: jest.fn(),
    findByInvestor: jest.fn(),
    checkPeriod: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    service.findByInvestor.mockResolvedValue([{ id: 'wrong-route' }]);
    service.checkPeriod.mockResolvedValue({ id: 'period-payment' });

    const moduleRef = await Test.createTestingModule({
      controllers: [InvestorPaymentsController],
      providers: [{ provide: InvestorPaymentsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('routes the static check endpoint before the investor id parameter endpoint', async () => {
    await request(app.getHttpServer())
      .get('/investor-payments/check')
      .query({ investorId: 'investor-1', periodMonth: '6', periodYear: '2026' })
      .expect(200)
      .expect({ id: 'period-payment' });

    expect(service.checkPeriod).toHaveBeenCalledWith('investor-1', 6, 2026);
    expect(service.findByInvestor).not.toHaveBeenCalled();
  });
});
