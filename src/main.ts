import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  console.log('process.env.CLIENT_URL =====>', process.env.CLIENT_URL);
  app.enableCors({
    exposedHeaders: ['Content-Disposition'],
    origin: [process.env.CLIENT_URL],
    credentials: true,
  });

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
