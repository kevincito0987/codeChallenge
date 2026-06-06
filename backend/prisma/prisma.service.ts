import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor() {
    // Levantamos el pool de conexiones nativo de Node-Postgres al puerto físico correcto
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/twitter_clone?schema=public';
    
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    // Pasamos el adaptador de JS directamente al super constructor de Prisma v7
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    // Se conecta usando el pool de node-postgres sin intermediarios binarios rotos
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}