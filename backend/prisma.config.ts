import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Si process.env no viene cargado por el CLI, le inyectamos la cadena directa de Docker
    url:
      process.env.DATABASE_URL ||
      'postgresql://twitter_dev_user:twitter_dev_password@db:5432/twitter_clone_db?schema=public',
  },
});
