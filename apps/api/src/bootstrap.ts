import 'reflect-metadata';

import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';
import { createApiAuthenticationMiddleware } from './security/api-authentication.js';

export async function createApplication(): Promise<INestApplication> {
  const application = await NestFactory.create(AppModule);
  application.use(createApiAuthenticationMiddleware(process.env));
  application.enableShutdownHooks();
  return application;
}
