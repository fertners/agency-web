import 'reflect-metadata';

import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

export async function createApplication(): Promise<INestApplication> {
  const application = await NestFactory.create(AppModule);
  application.enableShutdownHooks();
  return application;
}
