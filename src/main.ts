import './load-env.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configurerApplication } from './configurer-application.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configurerApplication(app);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
