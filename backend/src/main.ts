import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { networkInterfaces } from 'os';
import { AppModule } from './app.module';

const getLocalIpAddresses = () =>
  Object.values(networkInterfaces())
    .flatMap((networkInterface) => networkInterface ?? [])
    .filter((details) => details.family === 'IPv4' && !details.internal)
    .map((details) => details.address);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen(4000, '0.0.0.0');

  const localIps = getLocalIpAddresses();
  if (localIps.length > 0) {
    console.log(`API available on: ${localIps.map((ip) => `http://${ip}:4000`).join(', ')}`);
  }
}

bootstrap();
