import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { InvestmentsModule } from './modules/investments/investments.module';
import { InvestorPaymentsModule } from './modules/investor-payments/investor-payments.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { PortfoliosModule } from './modules/portfolios/portfolios.module';
import { CollectionInteractionsModule } from './modules/collection-interactions/collection-interactions.module';
import { CashModule } from './modules/cash/cash.module';
import { SearchModule } from './modules/search/search.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthController } from './health.controller';
import { KeepaliveService } from './common/services/keepalive.service';

const isCloudflareWorker = process.env.CLOUDFLARE_WORKER === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ...(isCloudflareWorker ? { ignoreEnvFile: true } : { envFilePath: '.env' }),
    }),
    ...(isCloudflareWorker ? [] : [ScheduleModule.forRoot()]),
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
    InvestmentsModule,
    InvestorPaymentsModule,
    DocumentsModule,
    TasksModule,
    PortfoliosModule,
    CollectionInteractionsModule,
    CashModule,
    SearchModule,
    SettingsModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    ...(isCloudflareWorker ? [] : [KeepaliveService]),
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
