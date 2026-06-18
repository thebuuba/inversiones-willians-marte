import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@inversiones/database';
import { AppModule } from './../src/app.module';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { requestIdMiddleware } from './../src/common/middleware/request-id';

jest.setTimeout(30_000);

describe('App (e2e)', () => {
  let app: INestApplication<App>;
  const runId = `e2e-${Date.now()}`;
  const password = 'E2ePassword123';
  let userId = '';
  let productId = '';
  let clientId = 0;
  let loanId = '';
  let paymentId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(requestIdMiddleware);
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const user = await prisma.user.create({
      data: {
        name: 'E2E Admin',
        username: runId,
        email: `${runId}@example.com`,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'ADMIN',
      },
    });
    userId = user.id;

    const product = await prisma.loanProduct.create({
      data: {
        name: `E2E Product ${runId}`,
        interestType: 'FIXED',
        interestRate: 0,
        paymentFrequency: 'MONTHLY',
        maxTerm: 12,
        minAmount: 1,
      },
    });
    productId = product.id;
  });

  it('/api/v1/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({
        success: true,
        data: {
          status: 'ok',
          service: 'backend',
        },
      });
  });

  it('covers login, client, loan, payment, and dashboard flow', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: runId, password })
      .expect(201);
    const token = login.body.data.accessToken as string;

    const client = await request(app.getHttpServer())
      .post('/api/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Cliente',
        lastName: runId,
        phone: '8095550000',
      })
      .expect(201);
    clientId = client.body.data.id;

    const loan = await request(app.getHttpServer())
      .post('/api/v1/loans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId,
        productId,
        principal: 1000,
        term: 1,
        startDate: '2026-06-18',
      })
      .expect(201);
    loanId = loan.body.data.id;

    const payment = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        loanId,
        clientId,
        amount: 1000,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'cash',
      })
      .expect(201);
    paymentId = payment.body.data.id;

    const dashboard = await request(app.getHttpServer())
      .get('/api/v1/reports/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(dashboard.body.data.totalClients).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.data.collectionsToday).toBeGreaterThanOrEqual(1000);
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { userId } });
    if (loanId) {
      const allocationFilters = [{ schedule: { loanId } }];
      if (paymentId) allocationFilters.push({ paymentId });
      await prisma.paymentAllocation.deleteMany({
        where: { OR: allocationFilters },
      });
      if (paymentId) await prisma.payment.deleteMany({ where: { id: paymentId } });
      await prisma.paymentSchedule.deleteMany({ where: { loanId } });
      await prisma.loan.deleteMany({ where: { id: loanId } });
    }
    if (clientId) await prisma.client.deleteMany({ where: { id: clientId } });
    if (productId) await prisma.loanProduct.deleteMany({ where: { id: productId } });
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await app.close();
  });
});
