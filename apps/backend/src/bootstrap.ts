import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { requestIdMiddleware } from './common/middleware/request-id';
import { parseCorsOrigins } from './config/cors-origins';

export function configureNestApplication(app: NestExpressApplication) {
  app.setGlobalPrefix('api/v1');
  app.useBodyParser('json', { limit: '2mb' });
  app.useBodyParser('urlencoded', { limit: '2mb', extended: true });
  app.use(helmet());
  app.use(requestIdMiddleware);

  app.enableCors({
    origin: parseCorsOrigins(process.env.FRONTEND_URL),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
}
