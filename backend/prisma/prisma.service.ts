import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// 🟢 Salimos de src/ para buscar la carpeta generada en la raíz del proyecto
import { PrismaClient as LocalPrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly _client: any;
  // Firma indexadora para permitir llamadas como this.prisma.user, this.prisma.tweet sin errores de tipo
  [key: string]: any;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);

    // Instanciamos el cliente real pasándole el adaptador nativo de PG
    this._client = new LocalPrismaClient({ adapter });

    // Redirección dinámica mediante Proxy
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop in target) return target[prop as string];
        return target._client[prop];
      },
    });
  }

  async onModuleInit() {
    // Conectamos el cliente al levantar el módulo de NestJS
    await this._client.$connect();
  }

  async onModuleDestroy() {
    // Cerramos la piscina de conexiones al apagar el servidor de desarrollo
    await this._client.$disconnect();
  }
}
