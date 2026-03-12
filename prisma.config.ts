import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// Isso força o Prisma a ler o seu arquivo .env local
dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});