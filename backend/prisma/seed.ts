import 'dotenv/config';
// 🟢 Importamos el cliente y el Enum Role generado nativamente por Prisma
import { PrismaClient, Role } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pkg;

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://twitter_dev_user:twitter_dev_password@db:5432/twitter_clone_db?schema=public';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log(
    '✨ Conexión establecida mediante Adapter. Iniciando seeding del Twitter Clone con Enums...',
  );

  // --- 1. Crear Cuenta de Administrador de Prueba ---
  const adminEmail = 'admin@test.com';
  const adminPassword = await bcrypt.hash('AdminPassword123$', 10);

  const existingAdmin = await prisma.user.findFirst({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin_root',
        passwordHash: adminPassword,
        bio: 'Cuenta de Administrador Global de la plataforma.',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=admin_root',
        // 🟢 Asignación usando el enum nativo directo
        role: Role.admin,
      },
    });
    console.log('✅ Usuario Administrador sembrado con éxito.');
  }

  // --- 2. Crear Cuenta Estándar de Prueba ---
  const userEmail = 'kevin_test@test.com';
  const userPassword = await bcrypt.hash('UserPassword123$', 10);

  const existingUser = await prisma.user.findFirst({
    where: { email: userEmail },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: userEmail,
        username: 'kevindev_test',
        passwordHash: userPassword,
        bio: 'Junior Full Stack Developer testing features.',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=kevindev_test',
        // 🟢 Asignación usando el enum nativo directo
        role: Role.user,
      },
    });
    console.log('✅ Usuario Estándar sembrado con éxito.');
  }

  console.log('🚀 Todo listo. Base de datos poblada de forma segura.');
  await pool.end();
}

main().catch((e) => {
  console.error('❌ Error en el seeding:', e);
  process.exit(1);
});
