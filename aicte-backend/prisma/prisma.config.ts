import { defineConfig } from '@prisma/cli';

export default defineConfig({
  datasources: {
    db: {
      provider: 'postgresql',
      url: 'postgresql://postgres:abcdefgh@localhost:5432/aicte_db',
    },
  },
});