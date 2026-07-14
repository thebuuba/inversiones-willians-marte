import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureNestApplication } from './bootstrap';
import { configureSharpDocumentImageProcessor } from './modules/documents/node-sharp-document-processor';

async function bootstrap() {
  configureSharpDocumentImageProcessor();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  configureNestApplication(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`Server running on http://localhost:${port}`, 'Bootstrap');
}
void bootstrap();
