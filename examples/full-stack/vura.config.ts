import { defineConfig } from 'vura';

export default defineConfig({
  server: {
    defaultPageMode: 'server',
  },
  rpc: {
    schema: 'zod',
    openapi: {
      title: 'Full-Stack API',
      version: '1.0.0',
    },
  },
});
