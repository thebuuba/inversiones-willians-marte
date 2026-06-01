import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { LoanProductsModule } from './modules/loan-products/loan-products.module';
import { LoansModule } from './modules/loans/loans.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { RequestsModule } from './modules/requests/requests.module';
import { InvestorsModule } from './modules/investors/investors.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    AuthModule,
    UsersModule,
    ClientsModule,
    LoanProductsModule,
    LoansModule,
    PaymentsModule,
    ReportsModule,
    AuditModule,
    RequestsModule,
    InvestorsModule,
    DocumentsModule,
    TasksModule,
    PortfoliosModule,
  ],
})
export class AppModule {}
